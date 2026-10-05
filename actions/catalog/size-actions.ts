"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import { slugify } from "@/lib/slugify";

const dimension = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{1,4}(\.\d{1,2})?$/.test(v));

const sizeSchema = z.object({
  name: z.string().trim().min(1).max(60),
  widthCm: dimension,
  heightCm: dimension,
  depthCm: dimension,
  sortOrder: z.string().trim().regex(/^\d{1,4}$/),
});

const read = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

function readSize(formData: FormData) {
  return sizeSchema.safeParse({
    name: read(formData, "name"),
    widthCm: read(formData, "widthCm"),
    heightCm: read(formData, "heightCm"),
    depthCm: read(formData, "depthCm"),
    sortOrder: read(formData, "sortOrder") || "0",
  });
}

const toDecimal = (value: string) => (value === "" ? null : value);

// Goes back to the sizes page, optionally with an error code for the banner
function finish(error?: string): never {
  revalidatePath("/admin/sizes");
  redirect(error ? `/admin/sizes?error=${error}` : "/admin/sizes");
}

export async function createSize(formData: FormData) {
  await requireAdmin();

  const parsed = readSize(formData);
  if (!parsed.success) finish("invalid");
  const { data } = parsed;

  const slug = slugify(data.name);
  if (!slug) finish("invalid");

  const exists = await db.size.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (exists) finish("duplicate");

  await db.size.create({
    data: {
      name: data.name,
      slug,
      widthCm: toDecimal(data.widthCm),
      heightCm: toDecimal(data.heightCm),
      depthCm: toDecimal(data.depthCm),
      sortOrder: Number(data.sortOrder),
    },
  });
  finish();
}

export async function updateSize(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");

  const parsed = readSize(formData);
  if (!parsed.success) finish("invalid");
  const { data } = parsed;

  await db.size.updateMany({
    where: { id },
    data: {
      name: data.name,
      widthCm: toDecimal(data.widthCm),
      heightCm: toDecimal(data.heightCm),
      depthCm: toDecimal(data.depthCm),
      sortOrder: Number(data.sortOrder),
      isActive: formData.get("isActive") === "on",
    },
  });
  finish();
}

export async function deleteSize(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");

  const inUse = await db.productVariant.count({
    where: { sizeId: id, deletedAt: null },
  });
  if (inUse > 0) finish("in-use");

  await db.size.deleteMany({ where: { id } });
  finish();
}