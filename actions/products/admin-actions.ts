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

  const created = await db.product.create({
    data: toProductDbData(data),
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

  try {
    await db.product.update({ where: { id }, data: toProductDbData(data) });
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
// ---------- Duplicate a product ----------

async function uniqueSlug(base: string) {
  let candidate = base;
  let n = 2;
  while (
    await db.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

async function uniqueSku(base: string) {
  let candidate = `${base}-COPY`;
  let n = 2;
  while (
    await db.productVariant.findUnique({
      where: { sku: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${base}-COPY${n++}`;
  }
  return candidate;
}

export async function duplicateProduct(formData: FormData) {
  await requireAdmin();

  const source = await db.product.findFirst({
    where: { id: idFrom(formData), deletedAt: null },
    include: {
      variants: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!source) return;

  const slug = await uniqueSlug(`${source.slug}-copy`);

  const variants = [];
  for (const variant of source.variants) {
    variants.push({
      name: variant.name,
      sku: await uniqueSku(variant.sku),
      sizeId: variant.sizeId,
      price: variant.price,
      salePrice: variant.salePrice,
      // Stock starts at 0, so a copy can't be sold by accident
      stock: 0,
      widthCm: variant.widthCm,
      heightCm: variant.heightCm,
      depthCm: variant.depthCm,
      weightGrams: variant.weightGrams,
      sortOrder: variant.sortOrder,
      isActive: variant.isActive,
    });
  }

  const copy = await db.product.create({
    data: {
      name: `${source.name} (copy)`,
      slug,
      categoryId: source.categoryId,
      subcategoryId: source.subcategoryId,
      artist: source.artist,
      shortDescription: source.shortDescription,
      description: source.description,
      material: source.material,
      medium: source.medium,
      tags: source.tags,
      yearCreated: source.yearCreated,
      artworkType: source.artworkType,
      editionNumber: null,
      totalEditions: source.totalEditions,
      hasCertificate: source.hasCertificate,
      isSigned: source.isSigned,
      provenance: source.provenance,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      isFeatured: false,
      status: "DRAFT",
      variants: { create: variants },
    },
    select: { id: true },
  });

  refreshPublicSite();
  redirect(`/admin/products/${copy.id}/edit?duplicated=1`);
}