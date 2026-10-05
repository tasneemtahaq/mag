"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import {
  UPLOAD_FOLDER,
  createUploadSignature,
  deleteImage,
} from "@/lib/storage/cloudinary";

function refresh(productId: string) {
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/", "layout");
}

const idFrom = (formData: FormData) => String(formData.get("id") ?? "");

// Step 2 of the upload: only an admin can get a signature
export async function getUploadSignature() {
  await requireAdmin();
  return createUploadSignature();
}

// What the browser reports after Cloudinary has stored a photo.
// We only accept photos that live in OUR folder on Cloudinary.
const uploadedImageSchema = z.object({
  publicId: z.string().startsWith(`${UPLOAD_FOLDER}/`),
  url: z.string().startsWith("https://res.cloudinary.com/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export async function addProductImages(productId: string, images: unknown) {
  await requireAdmin();

  const parsed = z.array(uploadedImageSchema).min(1).max(20).safeParse(images);
  if (!parsed.success) {
    return { ok: false as const, message: "The uploaded image details were not valid." };
  }

  const [last, mainCount] = await Promise.all([
    db.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    }),
    db.productImage.count({ where: { productId, isMain: true } }),
  ]);
  const firstOrder = (last._max.sortOrder ?? -1) + 1;

  await db.productImage.createMany({
    data: parsed.data.map((image, index) => ({
      productId,
      url: image.url,
      publicId: image.publicId,
      width: image.width,
      height: image.height,
      sortOrder: firstOrder + index,
      // The very first photo becomes the main one
      isMain: mainCount === 0 && index === 0,
    })),
  });

  refresh(productId);
  return { ok: true as const };
}

export async function setMainImage(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);

  const image = await db.productImage.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!image) return;

  await db.$transaction([
    db.productImage.updateMany({
      where: { productId: image.productId, isMain: true },
      data: { isMain: false },
    }),
    db.productImage.update({ where: { id }, data: { isMain: true } }),
  ]);
  refresh(image.productId);
}

export async function moveProductImage(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  const step = formData.get("direction") === "left" ? -1 : 1;

  const image = await db.productImage.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!image) return;

  const ordered = await db.productImage.findMany({
    where: { productId: image.productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const index = ordered.findIndex((item) => item.id === id);
  const target = index + step;
  if (index === -1 || target < 0 || target >= ordered.length) return;

  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await db.$transaction(
    ordered.map((item, position) =>
      db.productImage.update({
        where: { id: item.id },
        data: { sortOrder: position },
      }),
    ),
  );
  refresh(image.productId);
}

export async function deleteProductImage(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);

  const image = await db.productImage.findUnique({ where: { id } });
  if (!image) return;

  await db.productImage.delete({ where: { id } });

  // Also remove the file from Cloudinary (a failure here must not break the page)
  if (image.publicId) {
    try {
      await deleteImage(image.publicId);
    } catch (error) {
      console.error("Could not delete the image from Cloudinary", error);
    }
  }

  // If the main image was deleted, the first remaining one takes over
  if (image.isMain) {
    const next = await db.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (next) {
      await db.productImage.update({
        where: { id: next.id },
        data: { isMain: true },
      });
    }
  }
  refresh(image.productId);
}