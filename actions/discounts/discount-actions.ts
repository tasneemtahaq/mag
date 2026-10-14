"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/lib/db/prisma";
import {
  parseDiscountForm,
  toDiscountDbData,
} from "@/lib/validation/discount";
import type { DiscountFormState } from "@/lib/validation/discount";

const idFrom = (formData: FormData) => String(formData.get("id") ?? "");

export async function createDiscount(
  _previous: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  await requireAdmin();

  const parsed = parseDiscountForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  const taken = await db.discount.findUnique({
    where: { code: data.code },
    select: { id: true },
  });
  if (taken) {
    return { errors: { code: "Another discount already uses this code" }, values };
  }

  await db.discount.create({ data: toDiscountDbData(data) });

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function updateDiscount(
  id: string,
  _previous: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  await requireAdmin();

  const parsed = parseDiscountForm(formData);
  if (!parsed.success) return parsed.state;
  const { data, values } = parsed;

  const existing = await db.discount.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { message: "This discount no longer exists.", values };

  const taken = await db.discount.findUnique({
    where: { code: data.code },
    select: { id: true },
  });
  if (taken && taken.id !== id) {
    return { errors: { code: "Another discount already uses this code" }, values };
  }

  await db.discount.update({ where: { id }, data: toDiscountDbData(data) });

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function setDiscountActive(formData: FormData) {
  await requireAdmin();
  await db.discount.updateMany({
    where: { id: idFrom(formData) },
    data: { isActive: formData.get("active") === "true" },
  });
  revalidatePath("/admin/discounts");
}

export async function deleteDiscount(formData: FormData) {
  await requireAdmin();
  const id = idFrom(formData);

  // A code that has been used belongs to past orders, so it can only be switched off
  const used = await db.discountUsage.count({ where: { discountId: id } });
  if (used > 0) redirect(`/admin/discounts/${id}/edit?error=used`);

  await db.discount.deleteMany({ where: { id } });
  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}