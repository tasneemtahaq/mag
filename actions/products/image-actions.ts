"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import { createUploadSignature, deleteImage } from "@/lib/storage/cloudinary";
import { MAX_PRODUCT_IMAGES, UPLOAD_FOLDER } from "@/lib/storage/limits";
import { uploadedImageSchema } from "@/lib/validation/uploaded-image";

function refresh(productId: string) {
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/", "layout");
}

const idFrom = (formData: FormData) => String(formData.get("id") ?? "");

// Step 1 of an upload: only an admin can get a signature
export async function getUploadSignature() {
  await requireAdmin();
  return createUploadSignature();
}

export async function addProductImages(productId: string, images: unknown) {
  await requireAdmin();

  const parsed = z
    .array(uploadedImageSchema)
    .min(1)
    .max(MAX_PRODUCT_IMAGES)
    .safeParse(images);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "The uploaded image details were not valid.",
    };
  }

  const [existing, last, mainCount] = await Promise.all([
    db.productImage.count({ where: { productId } }),
    db.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    }),
    db.productImage.count({ where: { productId, isMain: true } }),
  ]);

  if (existing + parsed.data.length > MAX_PRODUCT_IMAGES) {
    return {
      ok: false as const,
      message: `A product can have at most ${MAX_PRODUCT_IMAGES} photos. Delete one to add another.`,
    };
  }

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

// Removes a photo that was uploaded but never attached to a product
export async function discardUploadedImage(publicId: string) {
  await requireAdmin();
  if (typeof publicId !== "string" || !publicId.startsWith(`${UPLOAD_FOLDER}/`)) {
    return;
  }
  // Never remove a photo that a product is using
  const stillUsed = await db.productImage.count({ where: { publicId } });
  if (stillUsed > 0) return;

  try {
    await deleteImage(publicId);
  } catch (error) {
    console.error("Could not discard the uploaded image", error);
  }
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