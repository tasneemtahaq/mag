"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import { parseCategoryForm } from "@/lib/validation/category";
import type { CategoryFormState } from "@/lib/validation/category";

// After any change, tell Next.js to rebuild the public pages that show categories
function refreshPublicSite() {
  revalidatePath("/", "layout");
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

const idFrom = (formData: FormData) => String(formData.get("id") ?? "");

export async function createCategory(
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  // New categories go to the end of the list
  const last = await db.category.aggregate({ _max: { sortOrder: true } });

  try {
    await db.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        isActive: data.isActive,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        errors: { slug: "Another category already uses this slug" },
        values,
      };
    }
    throw error;
  }

  refreshPublicSite();
  redirect("/admin/categories");
}

export async function updateCategory(
  id: string,
  _previous: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  try {
    await db.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        isActive: data.isActive,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        errors: { slug: "Another category already uses this slug" },
        values,
      };
    }
    if (isNotFound(error)) {
      return { message: "This category no longer exists.", values };
    }
    throw error;
  }

  refreshPublicSite();
  redirect("/admin/categories");
}

export async function setCategoryActive(formData: FormData) {
  await requireAdmin();
  await db.category.updateMany({
    where: { id: idFrom(formData), archivedAt: null },
    data: { isActive: formData.get("active") === "true" },
  });
  refreshPublicSite();
}

export async function moveCategory(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);
  const step = formData.get("direction") === "up" ? -1 : 1;

  const ordered = await db.category.findMany({
    where: { archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });

  const index = ordered.findIndex((category) => category.id === id);
  const target = index + step;
  if (index === -1 || target < 0 || target >= ordered.length) return;

  // Swap the two neighbours, then number the whole list 0, 1, 2...
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  await db.$transaction(
    ordered.map((category, position) =>
      db.category.update({
        where: { id: category.id },
        data: { sortOrder: position },
      }),
    ),
  );
  refreshPublicSite();
}

export async function archiveCategory(formData: FormData) {
  await requireAdmin();
  await db.category.updateMany({
    where: { id: idFrom(formData) },
    data: { archivedAt: new Date(), isActive: false },
  });
  refreshPublicSite();
  redirect("/admin/categories");
}

export async function restoreCategory(formData: FormData) {
  await requireAdmin();
  // It comes back switched off, so you choose when it goes live
  await db.category.updateMany({
    where: { id: idFrom(formData) },
    data: { archivedAt: null },
  });
  refreshPublicSite();
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);

  // Never delete a category that still has artwork in it
  const productCount = await db.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    redirect(`/admin/categories/${id}/edit?error=has-products`);
  }

  // Its subcategories are deleted with it (the schema says "Cascade")
  await db.category.deleteMany({ where: { id } });
  refreshPublicSite();
  redirect("/admin/categories");
}