import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import { ORDER_STATUS_VALUES } from "@/lib/order-labels";
import type { OrderStatusValue } from "@/lib/order-labels";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export type AdminOrderFilters = {
  q: string;
  status: OrderStatusValue | "";
  page: number;
};

// How many orders are in each status (for the tabs)
export async function getOrderStatusCounts() {
  await requireAdmin();
  const rows = await db.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    ORDER_STATUS_VALUES.map((status) => [status, 0]),
  ) as Record<OrderStatusValue, number>;
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

export async function getAdminOrdersPage(filters: AdminOrderFilters) {
  await requireAdmin();
  const { q, status, page } = filters;

  // "MAG-1001" or "1001" finds order number 1001 (stored as 1)
  const digits = q.replace(/\D/g, "");
  const orderNumber = digits.length >= 4 ? Number(digits) - 1000 : NaN;
  const phoneText = q.replace(/[\s\-()]/g, "");

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { customerName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: phoneText } },
            { shipCity: { contains: q, mode: "insensitive" } },
            ...(Number.isInteger(orderNumber) && orderNumber > 0
              ? [{ number: orderNumber }]
              : []),
          ],
        }
      : {}),
  };

  const total = await db.order.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pageCount);

  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * ADMIN_ORDERS_PAGE_SIZE,
    take: ADMIN_ORDERS_PAGE_SIZE,
    select: {
      id: true,
      number: true,
      createdAt: true,
      customerName: true,
      customerEmail: true,
      total: true,
      status: true,
      _count: { select: { items: true } },
       payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, provider: true, receiptSubmittedAt: true },
      },
    },
  });

  return { orders, total, page: current, pageCount };
}

export async function getAdminOrder(id: string) {
  await requireAdmin();
  return db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      payments: {
        orderBy: { createdAt: "desc" },
        include: { receipts: { orderBy: { createdAt: "asc" } } },
      },
      user: { select: { id: true, email: true } },
    },
  });
}