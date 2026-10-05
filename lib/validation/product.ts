import { z } from "zod";
import { slugify } from "@/lib/slugify";

const MONEY = /^\d{1,12}(\.\d{1,2})?$/;
const MONEY_MESSAGE = "Enter an amount like 85000 or 85000.50";

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (v) =>
        v === "" || (/^\d{1,9}$/.test(v) && Number(v) >= min && Number(v) <= max),
      `${label} must be a whole number from ${min} to ${max}`,
    );

const dimension = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{1,4}(\.\d{1,2})?$/.test(v),
    "Enter centimetres, like 60 or 60.5",
  );

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(120, "Name must be 120 characters or fewer"),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(120, "Slug must be 120 characters or fewer")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use only lowercase letters, numbers and single hyphens",
      ),
    categoryId: z.string().min(1, "Choose a category"),
    subcategoryId: z.string(),
    artist: z.string().trim().max(120, "Keep it under 120 characters"),
    shortDescription: z.string().trim().max(300, "Keep it under 300 characters"),
    description: z.string().trim().max(5000, "Keep it under 5000 characters"),
    material: z.string().trim().max(120, "Keep it under 120 characters"),
    medium: z.string().trim().max(120, "Keep it under 120 characters"),
    tags: z.string().trim().max(300, "Keep the tags under 300 characters"),
    yearCreated: wholeNumber("Year", 1000, new Date().getFullYear() + 1),
    artworkType: z.enum(["ORIGINAL", "PRINT"]),
    editionNumber: wholeNumber("Edition number", 1, 100000),
    totalEditions: wholeNumber("Total editions", 1, 100000),
    hasCertificate: z.boolean(),
    isSigned: z.boolean(),
    provenance: z.string().trim().max(2000, "Keep it under 2000 characters"),
    isFeatured: z.boolean(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    sku: z
      .string()
      .trim()
      .min(3, "The SKU must be at least 3 characters")
      .max(40, "The SKU must be 40 characters or fewer")
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
        "Use letters, numbers, dots, hyphens and underscores only",
      ),
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
    weightGrams: wholeNumber("Weight", 1, 1000000),
  })
  .superRefine((value, ctx) => {
    if (value.salePrice !== "" && Number(value.salePrice) >= Number(value.price)) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "The sale price must be lower than the price",
      });
    }
    if (
      value.editionNumber !== "" &&
      value.totalEditions !== "" &&
      Number(value.editionNumber) > Number(value.totalEditions)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["editionNumber"],
        message: "The edition number can't be higher than the total",
      });
    }
  });

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductFieldName = keyof ProductFormValues;

// What a form action hands back to the form
export type ProductFormState = {
  errors?: Partial<Record<ProductFieldName, string>>;
  message?: string;
  values?: ProductFormValues;
};

export const emptyProductValues: ProductFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  subcategoryId: "",
  artist: "",
  shortDescription: "",
  description: "",
  material: "",
  medium: "",
  tags: "",
  yearCreated: "",
  artworkType: "ORIGINAL",
  editionNumber: "",
  totalEditions: "",
  hasCertificate: false,
  isSigned: false,
  provenance: "",
  isFeatured: false,
  status: "DRAFT",
  sku: "",
  price: "",
  salePrice: "",
  stock: "1",
  widthCm: "",
  heightCm: "",
  depthCm: "",
  weightGrams: "",
};

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

const STRING_FIELDS = [
  "name", "slug", "categoryId", "subcategoryId", "artist", "shortDescription",
  "description", "material", "medium", "tags", "yearCreated", "artworkType",
  "editionNumber", "totalEditions", "provenance", "status", "sku", "price",
  "salePrice", "stock", "widthCm", "heightCm", "depthCm", "weightGrams",
] as const;

export function parseProductForm(formData: FormData) {
  const values = {
    ...Object.fromEntries(STRING_FIELDS.map((key) => [key, text(formData, key)])),
    hasCertificate: formData.get("hasCertificate") === "on",
    isSigned: formData.get("isSigned") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  } as ProductFormValues;

  // A blank slug is created from the name
  const result = productSchema.safeParse({
    ...values,
    slug: values.slug || slugify(values.name),
  });

  if (!result.success) {
    const errors: NonNullable<ProductFormState["errors"]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in errors)) {
        errors[key as ProductFieldName] = issue.message;
      }
    }
    return { success: false as const, state: { errors, values } };
  }

  return { success: true as const, data: result.data, values };
}

const toInt = (value: string) => (value === "" ? null : Number(value));
// Prices and sizes go to the database as text, which it reads as exact decimals
const toDecimal = (value: string) => (value === "" ? null : value);

function parseTags(value: string) {
  const seen = new Set<string>();
  for (const raw of value.split(",")) {
    const tag = raw.trim().slice(0, 40);
    if (tag) seen.add(tag);
  }
  return [...seen].slice(0, 20);
}

// Turns the validated form into the two things we save: the product and its variant
export function toProductDbData(data: ProductFormValues) {
  return {
    product: {
      name: data.name,
      slug: data.slug,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      artist: data.artist || null,
      shortDescription: data.shortDescription || null,
      description: data.description || null,
      material: data.material || null,
      medium: data.medium || null,
      tags: parseTags(data.tags),
      yearCreated: toInt(data.yearCreated),
      artworkType: data.artworkType,
      editionNumber: toInt(data.editionNumber),
      totalEditions: toInt(data.totalEditions),
      hasCertificate: data.hasCertificate,
      isSigned: data.isSigned,
      provenance: data.provenance || null,
      isFeatured: data.isFeatured,
      status: data.status,
    },
    variant: {
      sku: data.sku,
      price: data.price,
      salePrice: toDecimal(data.salePrice),
      stock: Number(data.stock),
      widthCm: toDecimal(data.widthCm),
      heightCm: toDecimal(data.heightCm),
      depthCm: toDecimal(data.depthCm),
      weightGrams: toInt(data.weightGrams),
    },
  };
}