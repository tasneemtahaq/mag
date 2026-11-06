import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import {
  rawalpindiDateString,
  startOfRawalpindiDay,
} from "@/lib/rawalpindi-time";

// A variant a customer could buy
const LIVE_VARIANT = { isActive: true, deletedAt: null } as const;

export async function getDashboardData() {
  await requireAdmin();

  const live = { deletedAt: null } as const;
  const active = { deletedAt: null, status: "ACTIVE" } as const;

  // The first moment of this month, in Pakistan time
  const monthStart = startOfRawalpindiDay(
    `${rawalpindiDateString(new Date()).slice(0, 8)}01`,
  );

  const [
    activeProducts,
    draftProducts,
    archivedProducts,
    withoutPhotos,
    withoutVariants,
    soldOut,
    recentProducts,
    activeCategories,
    hiddenCategories,
    archivedCategories,
    newOrders,
    ordersThisMonth,
    salesThisMonth,
    recentOrders,
    receiptsToCheck,
    awaitingPayment,
  ] = await Promise.all([
    db.product.count({ where: active }),
    db.product.count({ where: { ...live, status: "DRAFT" } }),
    db.product.count({ where: { ...live, status: "ARCHIVED" } }),
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
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { createdAt: { gte: monthStart } } }),
    db.order.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { total: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        number: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
        db.order.count({
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        payments: {
          some: { status: "PENDING", receiptSubmittedAt: { not: null } },
        },
      },
    }),
    db.order.count({
      where: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        payments: { some: { status: "PENDING", receiptSubmittedAt: null } },
      },
    }),
  ]);

  return {
    products: {
      active: activeProducts,
      draft: draftProducts,
      archived: archivedProducts,
    },
       attention: {
      withoutPhotos,
      withoutVariants,
      soldOut,
      receiptsToCheck,
      awaitingPayment,
    },
    categories: {
      active: activeCategories,
      hidden: hiddenCategories,
      archived: archivedCategories,
    },
    orders: {
      new: newOrders,
      thisMonth: ordersThisMonth,
      salesThisMonth: salesThisMonth._sum.total?.toNumber() ?? 0,
      recent: recentOrders,
    },
    recent: recentProducts,
  };
}