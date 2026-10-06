import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";

// A variant a customer could buy
const LIVE_VARIANT = { isActive: true, deletedAt: null } as const;

export async function getDashboardData() {
  await requireAdmin();

  const live = { deletedAt: null } as const;
  const active = { deletedAt: null, status: "ACTIVE" } as const;

  const [
    activeProducts,
    draftProducts,
    archivedProducts,
    withoutPhotos,
    withoutVariants,
    soldOut,
    recent,
    activeCategories,
    hiddenCategories,
    archivedCategories,
  ] = await Promise.all([
    db.product.count({ where: active }),
    db.product.count({ where: { ...live, status: "DRAFT" } }),
    db.product.count({ where: { ...live, status: "ARCHIVED" } }),
    // Active products that need attention:
    db.product.count({ where: { ...active, images: { none: {} } } }),
    db.product.count({ where: { ...active, variants: { none: LIVE_VARIANT } } }),
    db.product.count({
      where: {
        ...active,
        variants: {
          some: LIVE_VARIANT,
          none: { ...LIVE_VARIANT, stock: { gt: 0 } },
        },
      },
    }),
    db.product.findMany({
      where: live,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    }),
    db.category.count({ where: { isActive: true, archivedAt: null } }),
    db.category.count({ where: { isActive: false, archivedAt: null } }),
    db.category.count({ where: { archivedAt: { not: null } } }),
  ]);

  return {
    products: {
      active: activeProducts,
      draft: draftProducts,
      archived: archivedProducts,
    },
    attention: { withoutPhotos, withoutVariants, soldOut },
    categories: {
      active: activeCategories,
      hidden: hiddenCategories,
      archived: archivedCategories,
    },
    recent,
  };
}