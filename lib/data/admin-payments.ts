import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";

export async function getPaymentSettings() {
  await requireAdmin();
  return db.siteSettings.findUnique({ where: { id: "site" } });
}

const queueSelect = {
  id: true,
  number: true,
  customerName: true,
  total: true,
  createdAt: true,
  payments: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: { provider: true },
  },
} satisfies Prisma.OrderSelect;

// Orders still open, and waiting on payment, split by whether a receipt has arrived
function queue(receiptSent: boolean) {
  return db.order.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      payments: {
        some: {
          status: "PENDING",
          receiptSubmittedAt: receiptSent ? { not: null } : null,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: queueSelect,
  });
}

export async function getPaymentQueues() {
  await requireAdmin();
  const [toCheck, awaiting] = await Promise.all([queue(true), queue(false)]);
  return { toCheck, awaiting };
}