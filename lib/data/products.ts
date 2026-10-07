import "server-only";
import { db } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { cache } from "react";

// ---------- What a product card needs ----------
export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  artist: string | null;
  category: string;
  image: { url: string; alt: string | null } | null;
  price: number;
  // The original price, when the cheapest variant is on sale
  compareAtPrice: number | null;
  // True when variants have different prices ("From Rs 85,000")
  hasPriceRange: boolean;
  inStock: boolean;
};

// ---------- Sorting and paging ----------
export type ProductSort = "newest" | "featured" | "price-asc" | "price-desc";

export const productSorts: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export const DEFAULT_SORT: ProductSort = "newest";
const PAGE_SIZE = 12;

export function parseSort(value: string | undefined): ProductSort {
  return productSorts.some((option) => option.value === value)
    ? (value as ProductSort)
    : DEFAULT_SORT;
}

export function parsePage(value: string | undefined) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? Math.min(number, 1000) : 1;
}

// ---------- The one rule for what customers can see ----------
const ACTIVE_VARIANT = { isActive: true, deletedAt: null } as const;

function visibleWhere(categorySlug?: string): Prisma.ProductWhereInput {
  return {
    status: "ACTIVE",
    deletedAt: null,
    category: {
      isActive: true,
      archivedAt: null,
      ...(categorySlug ? { slug: categorySlug } : {}),
    },
    // A product with nothing to buy is not shown
    variants: { some: ACTIVE_VARIANT },
  };
}

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  artist: true,
  category: { select: { name: true } },
  images: {
    orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }],
    take: 1,
    select: { url: true, alt: true },
  },
  variants: {
    where: ACTIVE_VARIANT,
    select: { price: true, salePrice: true, stock: true },
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): ProductCardData {
  const priced = row.variants
    .map((variant) => ({
      effective: (variant.salePrice ?? variant.price).toNumber(),
      original: variant.price.toNumber(),
      onSale: variant.salePrice !== null,
      stock: variant.stock,
    }))
    .sort((a, b) => a.effective - b.effective);

  const cheapest = priced[0];
  const dearest = priced[priced.length - 1];
  const image = row.images[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    artist: row.artist,
    category: row.category.name,
    image: image ? { url: image.url, alt: image.alt } : null,
    price: cheapest.effective,
    compareAtPrice: cheapest.onSale ? cheapest.original : null,
    hasPriceRange: dearest.effective > cheapest.effective,
    inStock: priced.some((variant) => variant.stock > 0),
  };
}

// ---------- Queries ----------

// Featured products for the homepage. If none are marked featured,
// the newest products are shown instead.
export async function getFeaturedProducts(limit = 3) {
  const featured = await db.product.findMany({
    where: { ...visibleWhere(), isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  if (featured.length > 0) return featured.map(toCard);

  const newest = await db.product.findMany({
    where: visibleWhere(),
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return newest.map(toCard);
}

export async function getProductsPage({
  categorySlug,
  sort,
  page,
}: {
  categorySlug?: string;
  sort: ProductSort;
  page: number;
}) {
  const where = visibleWhere(categorySlug);
  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const skip = (current - 1) * PAGE_SIZE;

  if (sort === "price-asc" || sort === "price-desc") {
    // The database can't sort by "cheapest variant", so we rank them here
    const rows = await db.product.findMany({
      where,
      select: {
        id: true,
        variants: {
          where: ACTIVE_VARIANT,
          select: { price: true, salePrice: true },
        },
      },
    });

    const ranked = rows
      .map((row) => ({
        id: row.id,
        lowest: Math.min(
          ...row.variants.map((v) => (v.salePrice ?? v.price).toNumber()),
        ),
      }))
      .sort((a, b) =>
        sort === "price-asc" ? a.lowest - b.lowest : b.lowest - a.lowest,
      );

    const ids = ranked.slice(skip, skip + PAGE_SIZE).map((row) => row.id);
    const details = await db.product.findMany({
      where: { id: { in: ids } },
      select: cardSelect,
    });
    const byId = new Map(details.map((row) => [row.id, row]));

    return {
      products: ids.flatMap((id) => {
        const row = byId.get(id);
        return row ? [toCard(row)] : [];
      }),
      total,
      page: current,
      pageCount,
    };
  }

  const rows = await db.product.findMany({
    where,
    orderBy:
      sort === "featured"
        ? [{ isFeatured: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }],
    skip,
    take: PAGE_SIZE,
    select: cardSelect,
  });

  return { products: rows.map(toCard), total, page: current, pageCount };
}
// ---------- One product, for its own page ----------

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.product.findFirst({
    where: { ...visibleWhere(), slug },
    select: {
      id: true,
      slug: true,
      name: true,
      artist: true,
      shortDescription: true,
      description: true,
      material: true,
      medium: true,
      yearCreated: true,
      artworkType: true,
      editionNumber: true,
      totalEditions: true,
      hasCertificate: true,
      isSigned: true,
      provenance: true,
      seoTitle: true,
      seoDescription: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
      subcategory: { select: { name: true } },
      images: {
        orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }],
        select: { id: true, url: true, alt: true },
      },
      variants: {
        where: ACTIVE_VARIANT,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          salePrice: true,
          stock: true,
          widthCm: true,
          heightCm: true,
          depthCm: true,
          weightGrams: true,
          size: { select: { name: true } },
        },
      },
    },
  });
  if (!product) return null;

  return {
    ...product,
    // Plain numbers, so they can be handed to the browser-side components
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      sizeName: variant.size?.name ?? null,
      price: variant.price.toNumber(),
      salePrice: variant.salePrice?.toNumber() ?? null,
      stock: variant.stock,
      widthCm: variant.widthCm?.toNumber() ?? null,
      heightCm: variant.heightCm?.toNumber() ?? null,
      depthCm: variant.depthCm?.toNumber() ?? null,
      weightGrams: variant.weightGrams,
    })),
  };
});

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 3,
) {
  const rows = await db.product.findMany({
    where: { ...visibleWhere(), id: { not: productId }, categoryId },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

// For building the product pages in advance
export async function getVisibleProductSlugs(limit = 200) {
  const rows = await db.product.findMany({
    where: visibleWhere(),
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
}