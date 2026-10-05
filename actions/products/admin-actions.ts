"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import { parseProductForm, toProductDbData } from "@/lib/validation/product";
import type {
  ProductFormState,
  ProductFormValues,
} from "@/lib/validation/product";

function refreshPublicSite() {
  revalidatePath("/", "layout");
}

type Errors = NonNullable<ProductFormState["errors"]>;

// Checks the things only the database can tell us
async function findProblems(
  data: ProductFormValues,
  productId?: string,
): Promise<Errors | null> {
  const errors: Errors = {};

  const slugOwner = await db.product.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (slugOwner && slugOwner.id !== productId) {
    errors.slug = "Another product already uses this slug";
  }

  const skuOwner = await db.productVariant.findUnique({
    where: { sku: data.sku },
    select: { productId: true },
  });
  if (skuOwner && skuOwner.productId !== productId) {
    errors.sku = "Another product already uses this SKU";
  }

  const category = await db.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!category) errors.categoryId = "Choose a category";

  if (data.subcategoryId) {
    const sub = await db.subcategory.findFirst({
      where: { id: data.subcategoryId, categoryId: data.categoryId },
      select: { id: true },
    });
    if (!sub) {
      errors.subcategoryId =
        "This subcategory does not belong to the chosen category";
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

const idFrom = (formData: FormData) => String(formData.get("id") ?? "");

export async function createProduct(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  const problems = await findProblems(data);
  if (problems) return { errors: problems, values };

  const { product, variant } = toProductDbData(data);
  const created = await db.product.create({
    data: { ...product, variants: { create: { name: "Standard", ...variant } } },
    select: { id: true },
  });

  refreshPublicSite();
  redirect(`/admin/products/${created.id}/edit?created=1`);
}

export async function updateProduct(
  id: string,
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  const problems = await findProblems(data, id);
  if (problems) return { errors: problems, values };

  const { product, variant } = toProductDbData(data);
  const firstVariant = await db.productVariant.findFirst({
    where: { productId: id, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  try {
    await db.$transaction([
      db.product.update({ where: { id }, data: product }),
      firstVariant
        ? db.productVariant.update({ where: { id: firstVariant.id }, data: variant })
        : db.productVariant.create({
            data: { productId: id, name: "Standard", ...variant },
          }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { message: "This product no longer exists.", values };
    }
    throw error;
  }

  refreshPublicSite();
  redirect("/admin/products");
}

export async function setProductStatus(formData: FormData) {
  await requireAdmin();
  const status = formData.get("status");
  if (status !== "DRAFT" && status !== "ACTIVE" && status !== "ARCHIVED") return;

  await db.product.updateMany({
    where: { id: idFrom(formData), deletedAt: null },
    data: { status },
  });
  refreshPublicSite();
}

// "Delete" hides the product everywhere but keeps the record,
// so past orders that include it stay valid.
export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  await db.product.updateMany({
    where: { id: idFrom(formData) },
    data: { deletedAt: new Date(), status: "ARCHIVED", isFeatured: false },
  });
  refreshPublicSite();
  redirect("/admin/products");
}