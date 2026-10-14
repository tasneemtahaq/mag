import { z } from "zod";
import { endOfRawalpindiDay, startOfRawalpindiDay } from "@/lib/rawalpindi-time";
import {
  MONEY,
  MONEY_MESSAGE,
  optionalDate,
  optionalMoney,
  optionalWholeNumber,
} from "@/lib/validation/fields";

export const discountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "The code must be at least 3 characters")
      .max(40, "The code must be 40 characters or fewer")
      .regex(
        /^[A-Z0-9][A-Z0-9_-]*$/,
        "Use letters, numbers, hyphens and underscores only, with no spaces",
      ),
    description: z.string().trim().max(200, "Keep it under 200 characters"),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.string().trim().regex(MONEY, MONEY_MESSAGE),
    minOrderAmount: optionalMoney,
    maxUses: optionalWholeNumber("Maximum uses", 1, 1000000),
    startsAt: optionalDate,
    endsAt: optionalDate,
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const amount = Number(value.value);

    if (value.type === "PERCENTAGE" && (amount <= 0 || amount > 100)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a percentage above 0 and at most 100",
      });
    }
    if (value.type === "FIXED" && amount <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "The amount must be more than 0",
      });
    }
    if (value.startsAt && value.endsAt && value.endsAt < value.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "The end date can't be before the start date",
      });
    }
  });

export type DiscountFormValues = z.infer<typeof discountSchema>;
export type DiscountFieldName = keyof DiscountFormValues;

export type DiscountFormState = {
  errors?: Partial<Record<DiscountFieldName, string>>;
  message?: string;
  values?: DiscountFormValues;
};

export const emptyDiscountValues: DiscountFormValues = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const STRING_FIELDS = [
  "code", "description", "type", "value", "minOrderAmount",
  "maxUses", "startsAt", "endsAt",
] as const;

export function parseDiscountForm(formData: FormData) {
  const values = {
    ...Object.fromEntries(STRING_FIELDS.map((key) => [key, text(formData, key)])),
    isActive: formData.get("isActive") === "on",
  } as DiscountFormValues;

  const result = discountSchema.safeParse(values);

  if (!result.success) {
    const errors: NonNullable<DiscountFormState["errors"]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in errors)) {
        errors[key as DiscountFieldName] = issue.message;
      }
    }
    return { success: false as const, state: { errors, values } };
  }

  return { success: true as const, data: result.data, values };
}

export function toDiscountDbData(data: DiscountFormValues) {
  return {
    code: data.code,
    description: data.description || null,
    type: data.type,
    value: data.value,
    minOrderAmount: data.minOrderAmount || null,
    maxUses: data.maxUses ? Number(data.maxUses) : null,
    startsAt: data.startsAt ? startOfRawalpindiDay(data.startsAt) : null,
    endsAt: data.endsAt ? endOfRawalpindiDay(data.endsAt) : null,
    isActive: data.isActive,
  };
}