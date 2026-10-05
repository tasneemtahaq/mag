import { z } from "zod";

const MONEY = /^\d{1,12}(\.\d{1,2})?$/;
const MONEY_MESSAGE = "Enter an amount like 85000 or 85000.50";

const dimension = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{1,4}(\.\d{1,2})?$/.test(v),
    "Enter centimetres, like 60 or 60.5",
  );

export const variantSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Give the variant a name, for example Medium")
      .max(80, "Keep the name under 80 characters"),
    sku: z
      .string()
      .trim()
      .min(3, "The SKU must be at least 3 characters")
      .max(40, "The SKU must be 40 characters or fewer")
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
        "Use letters, numbers, dots, hyphens and underscores only",
      ),
    sizeId: z.string(),
    price: z.string().trim().regex(MONEY, MONEY_MESSAGE),
    salePrice: z
      .string()
      .trim()
      .refine((v) => v === "" || MONEY.test(v), MONEY_MESSAGE),
    stock: z
      .string()
      .trim()
      .regex(/^\d{1,6}$/, "Enter a whole number, 0 or more"),
    widthCm: dimension,
    heightCm: dimension,
    depthCm: dimension,
    weightGrams: z
      .string()
      .trim()
      .refine(
        (v) =>
          v === "" ||
          (/^\d{1,7}$/.test(v) && Number(v) >= 1 && Number(v) <= 1000000),
        "Enter the weight in grams, like 2500",
      ),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.salePrice !== "" && Number(value.salePrice) >= Number(value.price)) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "The sale price must be lower than the price",
      });
    }
  });

export type VariantFormValues = z.infer<typeof variantSchema>;
export type VariantFieldName = keyof VariantFormValues;

export type VariantFormState = {
  errors?: Partial<Record<VariantFieldName, string>>;
  message?: string;
  values?: VariantFormValues;
  saved?: boolean;
};

export const emptyVariantValues: VariantFormValues = {
  name: "",
  sku: "",
  sizeId: "",
  price: "",
  salePrice: "",
  stock: "1",
  widthCm: "",
  heightCm: "",
  depthCm: "",
  weightGrams: "",
  isActive: true,
};

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const STRING_FIELDS = [
  "name", "sku", "sizeId", "price", "salePrice", "stock",
  "widthCm", "heightCm", "depthCm", "weightGrams",
] as const;

export function parseVariantForm(formData: FormData) {
  const values = {
    ...Object.fromEntries(STRING_FIELDS.map((key) => [key, text(formData, key)])),
    isActive: formData.get("isActive") === "on",
  } as VariantFormValues;

  const result = variantSchema.safeParse(values);

  if (!result.success) {
    const errors: NonNullable<VariantFormState["errors"]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in errors)) {
        errors[key as VariantFieldName] = issue.message;
      }
    }
    return { success: false as const, state: { errors, values } };
  }

  return { success: true as const, data: result.data, values };
}

const toDecimal = (value: string) => (value === "" ? null : value);

export function toVariantDbData(data: VariantFormValues) {
  return {
    name: data.name,
    sku: data.sku,
    sizeId: data.sizeId || null,
    price: data.price,
    salePrice: toDecimal(data.salePrice),
    stock: Number(data.stock),
    widthCm: toDecimal(data.widthCm),
    heightCm: toDecimal(data.heightCm),
    depthCm: toDecimal(data.depthCm),
    weightGrams: data.weightGrams === "" ? null : Number(data.weightGrams),
    isActive: data.isActive,
  };
}