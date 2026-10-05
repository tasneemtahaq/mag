import "server-only";
import { cache } from "react";
import { db } from "@/lib/db/prisma";

// A category is visible to customers when it is switched on and not archived.

// "cache" remembers the answer for the length of one page render,
// so the footer and the page share a single database query.
export const getActiveCategories = cache(async () =>
  db.category.findMany({
    where: { isActive: true, archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true },
  }),
);

export async function getFooterCategories() {
  const categories = await getActiveCategories();
  return categories.map(({ name, slug }) => ({ name, slug }));
}

export const getCategoryBySlug = cache(async (slug: string) =>
  db.category.findFirst({
    where: { slug, isActive: true, archivedAt: null },
    select: {
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      subcategories: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true },
      },
    },
  }),
);