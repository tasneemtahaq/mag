import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";

export async function getAdminProducts() {
  await requireAdmin();
  return db.product.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      images: {
        where: { isMain: true },
        take: 1,
        select: { url: true, alt: true },
      },
      variants: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        select: { price: true, salePrice: true, stock: true },
      },
    },
  });
}

export async function getAdminProduct(id: string) {
  await requireAdmin();
  return db.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      // For now the form edits the first (and only) variant
      variants: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
}

// Categories (with their subcategories) for the product form's dropdowns
export async function getProductFormOptions() {
  await requireAdmin();
  return db.category.findMany({
    where: { archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      subcategories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      },
    },
  });
}