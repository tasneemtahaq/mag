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