"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PROVINCES } from "@/lib/checkout/provinces";
import { db } from "@/lib/db/prisma";
import { money, optionalMoney } from "@/lib/validation/fields";

const read = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

function done(notice: string): never {
  redirect(`/admin/shipping?notice=${notice}`);
}

function fail(error: string): never {
  redirect(`/admin/shipping?error=${error}`);
}

const toDecimal = (value: string) => (value === "" ? null : value);

// A size in inches: more than 0, up to 3 digits and 2 decimals
const inches = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,2})?$/)
  .refine((value) => Number(value) > 0);

const settingsSchema = z.object({
  shipRefHeightIn: inches,
  shipRefWidthIn: inches,
  shipRefThicknessIn: inches,
  shipRefPrice: money,
  shipMinPerItem: money,
  localDeliveryRate: money,
  freeShippingThreshold: optionalMoney,
});

const ruleSchema = z.object({
  name: z.string().trim().min(1).max(60),
  province: z
    .string()
    .refine(
      (value) => value === "" || (PROVINCES as readonly string[]).includes(value),
    ),
  city: z.string().trim().max(60),
  rate: money,
  freeAbove: optionalMoney,
  sortOrder: z.string().trim().regex(/^\d{1,4}$/),
});

function readRule(formData: FormData) {
  return ruleSchema.safeParse({
    name: read(formData, "name"),
    province: read(formData, "province"),
    city: read(formData, "city"),
    rate: read(formData, "rate"),
    freeAbove: read(formData, "freeAbove"),
    sortOrder: read(formData, "sortOrder") || "0",
  });
}

export async function saveShippingSettings(formData: FormData) {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    shipRefHeightIn: read(formData, "shipRefHeightIn"),
    shipRefWidthIn: read(formData, "shipRefWidthIn"),
    shipRefThicknessIn: read(formData, "shipRefThicknessIn"),
    shipRefPrice: read(formData, "shipRefPrice"),
    shipMinPerItem: read(formData, "shipMinPerItem") || "0",
    localDeliveryRate: read(formData, "localDeliveryRate") || "0",
    freeShippingThreshold: read(formData, "freeShippingThreshold"),
  });
  if (!parsed.success) fail("invalid-settings");
  const { data } = parsed;

  const values = {
    shipRefHeightIn: data.shipRefHeightIn,
    shipRefWidthIn: data.shipRefWidthIn,
    shipRefThicknessIn: data.shipRefThicknessIn,
    shipRefPrice: data.shipRefPrice,
    shipMinPerItem: data.shipMinPerItem,
    localDeliveryRate: data.localDeliveryRate,
    freeShippingThreshold: toDecimal(data.freeShippingThreshold),
  };

  await db.siteSettings.upsert({
    where: { id: "site" },
    update: values,
    create: { id: "site", ...values },
  });
  done("settings-saved");
}

export async function createShippingRule(formData: FormData) {
  await requireAdmin();

  const parsed = readRule(formData);
  if (!parsed.success) fail("invalid-rule");
  const { data } = parsed;

  await db.shippingRule.create({
    data: {
      name: data.name,
      province: data.province || null,
      city: data.city || null,
      rate: data.rate,
      freeAbove: toDecimal(data.freeAbove),
      sortOrder: Number(data.sortOrder),
      isActive: true,
    },
  });
  done("rule-added");
}

export async function updateShippingRule(formData: FormData) {
  await requireAdmin();
  const id = read(formData, "id");

  const parsed = readRule(formData);
  if (!parsed.success) fail("invalid-rule");
  const { data } = parsed;

  await db.shippingRule.updateMany({
    where: { id },
    data: {
      name: data.name,
      province: data.province || null,
      city: data.city || null,
      rate: data.rate,
      freeAbove: toDecimal(data.freeAbove),
      sortOrder: Number(data.sortOrder),
      isActive: formData.get("isActive") === "on",
    },
  });
  done("rule-saved");
}

export async function deleteShippingRule(formData: FormData) {
  await requireAdmin();
  await db.shippingRule.deleteMany({ where: { id: read(formData, "id") } });
  done("rule-deleted");
}