"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";

const text = (max: number) => z.string().trim().max(max);
const wallet = z.string().trim().regex(/^[0-9+\-\s]{0,30}$/);
const account = z.string().trim().regex(/^[0-9A-Za-z\-\s]{0,40}$/);

const schema = z.object({
  easypaisaTitle: text(80),
  easypaisaNumber: wallet,
  jazzcashTitle: text(80),
  jazzcashNumber: wallet,
  bankName: text(80),
  bankAccountTitle: text(80),
  bankAccountNumber: account,
  bankIban: account,
  bankBranch: text(80),
  paymentNote: text(500),
});

const KEYS = Object.keys(schema.shape) as (keyof z.infer<typeof schema>)[];

export async function savePaymentSettings(formData: FormData) {
  await requireAdmin();

  const parsed = schema.safeParse(
    Object.fromEntries(KEYS.map((key) => [key, String(formData.get(key) ?? "")])),
  );
  if (!parsed.success) redirect("/admin/payments?error=invalid");

  // Empty boxes are saved as "nothing", which turns that method off
  const data = Object.fromEntries(
    KEYS.map((key) => [key, parsed.data[key] || null]),
  ) as Record<(typeof KEYS)[number], string | null>;

  await db.siteSettings.upsert({
    where: { id: "site" },
    update: data,
    create: { id: "site", ...data },
  });
  redirect("/admin/payments?notice=saved");
}