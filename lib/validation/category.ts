import { z } from "zod";
import { slugify } from "@/lib/slugify";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80, "Slug must be 80 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use only lowercase letters, numbers and single hyphens, for example oil-paintings",
    ),
  description: z.string().trim().max(600, "Keep the description under 600 characters"),
  seoTitle: z.string().trim().max(70, "Keep the SEO title under 70 characters"),
  seoDescription: z
    .string()
    .trim()
    .max(170, "Keep the SEO description under 170 characters"),
  isActive: z.boolean(),
});

export type CategoryFieldName =
  | "name"
  | "slug"
  | "description"
  | "seoTitle"
  | "seoDescription";

export type CategoryFormValues = {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  isActive: boolean;
};

// What a form action hands back to the form
export type CategoryFormState = {
  errors?: Partial<Record<CategoryFieldName, string>>;
  message?: string;
  values?: CategoryFormValues;
};

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

export function parseCategoryForm(formData: FormData) {
  const values: CategoryFormValues = {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    isActive: formData.get("isActive") === "on",
  };

  // A blank slug is created from the name
  const result = categorySchema.safeParse({
    ...values,
    slug: values.slug || slugify(values.name),
  });

  if (!result.success) {
    const errors: NonNullable<CategoryFormState["errors"]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in errors)) {
        errors[key as CategoryFieldName] = issue.message;
      }
    }
    return { success: false as const, state: { errors, values } };
  }

  return { success: true as const, data: result.data, values };
}