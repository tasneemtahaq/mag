"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import { slugify } from "@/lib/slugify";

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  sortOrder: z.string().trim().regex(/^\d{1,4}$/),
});

const read = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

// Goes back to the page, optionally with an error code for the banner
function finish(error?: string): never {
  revalidatePath("/admin/subcategories");
  revalidatePath("/", "layout");
  redirect(
    error ? `/admin/subcategories?error=${error}` : "/admin/subcategories",
  );
}

export async function createSubcategory(formData: FormData) {
  await requireAdmin();
  const categoryId = read(formData, "categoryId");

  const parsed = schema.safeParse({
    name: read(formData, "name"),
    sortOrder: "0",
  });
  if (!parsed.success) finish("invalid");
  const { name } = parsed.data;

  const slug = slugify(name);
  if (!slug) finish("invalid");

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) finish("invalid");

  const taken = await db.subcategory.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
    select: { id: true },
  });
  if (taken) finish("duplicate");

  const last = await db.subcategory.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });

  await db.subcategory.create({
    data: {
      categoryId,
      name,
      slug,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
  finish();
}

export async function updateSubcategory(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");

  const parsed = schema.safeParse({
    name: read(formData, "name"),
    sortOrder: read(formData, "sortOrder") || "0",
  });
  if (!parsed.success) finish("invalid");
  const { name, sortOrder } = parsed.data;

  const slug = slugify(name);
  if (!slug) finish("invalid");

  const current = await db.subcategory.findUnique({
    where: { id },
    select: { categoryId: true },
  });
  if (!current) finish("invalid");

  // No two subcategories in one category may share a name
  const sibling = await db.subcategory.findFirst({
    where: { categoryId: current.categoryId, slug, NOT: { id } },
    select: { id: true },
  });
  if (sibling) finish("duplicate");

  await db.subcategory.update({
    where: { id },
    data: {
      name,
      sortOrder: Number(sortOrder),
      isActive: formData.get("isActive") === "on",
    },
  });
  finish();
}

export async function deleteSubcategory(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");

  const inUse = await db.product.count({
    where: { subcategoryId: id, deletedAt: null },
  });
  if (inUse > 0) finish("in-use");

  await db.subcategory.deleteMany({ where: { id } });
  finish();
}