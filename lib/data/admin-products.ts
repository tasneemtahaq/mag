import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

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
      variants: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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

// Sizes for the variant form's dropdown
export async function getSizeOptions() {
  await requireAdmin();
  const sizes = await db.size.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isActive: true },
  });
  return sizes.map((size) => ({
    id: size.id,
    name: size.isActive ? size.name : `${size.name} (hidden)`,
  }));
}
// ---------- The admin product list: search, filters, sorting, paging ----------
export const ADMIN_PAGE_SIZE = 20;

export type AdminProductFilters = {
  q: string;
  categoryId: string;
  status: string;
  sort: string;
  page: number;
};

export async function getAdminProductsPage(filters: AdminProductFilters) {
  await requireAdmin();
  const { q, categoryId, status, sort, page } = filters;

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(status === "DRAFT" || status === "ACTIVE" || status === "ARCHIVED"
      ? { status }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { artist: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { material: { contains: q, mode: "insensitive" } },
            { medium: { contains: q, mode: "insensitive" } },
            { tags: { has: q } },
            {
              variants: {
                some: { sku: { contains: q, mode: "insensitive" } },
              },
            },
          ],
        }
      : {}),
  };

  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pageCount);

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "name"
        ? { name: "asc" }
        : { createdAt: "desc" };

  const products = await db.product.findMany({
    where,
    orderBy,
    skip: (current - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
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

  return { products, total, page: current, pageCount };
}