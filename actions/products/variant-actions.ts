"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import { parseVariantForm, toVariantDbData } from "@/lib/validation/variant";
import type {
  VariantFormState,
  VariantFormValues,
} from "@/lib/validation/variant";

type Errors = NonNullable<VariantFormState["errors"]>;

function refresh(productId: string) {
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/", "layout");
}

async function findProblems(
  data: VariantFormValues,
  productId: string,
  variantId?: string,
): Promise<Errors | null> {
  const errors: Errors = {};

  const nameOwner = await db.productVariant.findUnique({
    where: { productId_name: { productId, name: data.name } },
    select: { id: true },
  });
  if (nameOwner && nameOwner.id !== variantId) {
    errors.name = "This product already has a variant with this name";
  }

  const skuOwner = await db.productVariant.findUnique({
    where: { sku: data.sku },
    select: { id: true },
  });
  if (skuOwner && skuOwner.id !== variantId) {
    errors.sku = "Another variant already uses this SKU";
  }

  if (data.sizeId) {
    const size = await db.size.findUnique({
      where: { id: data.sizeId },
      select: { id: true },
    });
    if (!size) errors.sizeId = "Choose a size from the list";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export async function createVariant(
  productId: string,
  _previous: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  await requireAdmin();

  const parsed = parseVariantForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  const product = await db.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });
  if (!product) return { message: "This product no longer exists.", values };

  const problems = await findProblems(data, productId);
  if (problems) return { errors: problems, values };

  const last = await db.productVariant.aggregate({
    where: { productId },
    _max: { sortOrder: true },
  });

  await db.productVariant.create({
    data: {
      productId,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
      ...toVariantDbData(data),
    },
  });

  refresh(productId);
  return { saved: true };
}

export async function updateVariant(
  variantId: string,
  _previous: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  await requireAdmin();

  const parsed = parseVariantForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  const variant = await db.productVariant.findFirst({
    where: { id: variantId, deletedAt: null },
    select: { productId: true },
  });
  if (!variant) return { message: "This variant no longer exists.", values };

  const problems = await findProblems(data, variant.productId, variantId);
  if (problems) return { errors: problems, values };

  await db.productVariant.update({
    where: { id: variantId },
    data: toVariantDbData(data),
  });

  refresh(variant.productId);
  return { saved: true };
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const variant = await db.productVariant.findUnique({
    where: { id },
    select: {
      productId: true,
      sku: true,
      name: true,
      _count: { select: { orderItems: true } },
    },
  });
  if (!variant) return;

  if (variant._count.orderItems === 0) {
    // Never ordered: remove it completely (carts lose it too)
    await db.productVariant.delete({ where: { id } });
  } else {
    // Already ordered: hide it, and free up its SKU and name for reuse
    const tag = `~deleted~${Date.now().toString(36)}`;
    await db.productVariant.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        sku: `${variant.sku}${tag}`,
        name: `${variant.name}${tag}`,
      },
    });
  }

  refresh(variant.productId);
}