import "server-only";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";

export async function getAdminDiscounts() {
  await requireAdmin();
  return db.discount.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getAdminDiscount(id: string) {
  await requireAdmin();
  return db.discount.findUnique({
    where: { id },
    include: { _count: { select: { usages: true } } },
  });
}