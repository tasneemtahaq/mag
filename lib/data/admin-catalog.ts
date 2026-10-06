import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";

export async function getAdminSizes() {
  await requireAdmin();
  return db.size.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { variants: true } } },
  });
}

// Every visible category with its subcategories, for the subcategories screen
export async function getAdminSubcategoryGroups() {
  await requireAdmin();
  return db.category.findMany({
    where: { archivedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      subcategories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          sortOrder: true,
          isActive: true,
          _count: { select: { products: true } },
        },
      },
    },
  });
}