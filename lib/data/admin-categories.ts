import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";

export async function getAdminCategories() {
  await requireAdmin();
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, subcategories: true } } },
  });
}

export async function getAdminCategory(id: string) {
  await requireAdmin();
  return db.category.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
      subcategories: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  });
}

export async function getAdminOverview() {
  await requireAdmin();
  const [active, disabled, archived] = await Promise.all([
    db.category.count({ where: { isActive: true, archivedAt: null } }),
    db.category.count({ where: { isActive: false, archivedAt: null } }),
    db.category.count({ where: { archivedAt: { not: null } } }),
  ]);
  return { active, disabled, archived };
}