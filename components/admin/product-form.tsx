"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { emptyProductValues } from "@/lib/validation/product";
import type {
  ProductFormState,
  ProductFormValues,
} from "@/lib/validation/product";

export type CategoryOption = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

// The form fields that hold text (as opposed to tick-boxes)
type StringField = {
  [K in keyof ProductFormValues]: ProductFormValues[K] extends string ? K : never;
}[keyof ProductFormValues];

type CheckboxName = "hasCertificate" | "isSigned" | "isFeatured";
type Errors = NonNullable<ProductFormState["errors"]>;
type Shared = { values: ProductFormValues; errors: Errors };

const controlClass =
  "flex h-10 w-full border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function FieldShell({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function TextField({
  name,
  label,
  hint,
  values,
  errors,
  ...rest
}: Shared & { name: StringField; label: string; hint?: string } & Omit<
    ComponentProps<typeof Input>,
    "name" | "defaultValue" | "id"
  >) {
  const error = errors[name];
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <Input
        id={name}
        name={name}
        defaultValue={values[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

function AreaField({
  name,
  label,
  hint,
  rows = 4,
  values,
  errors,
}: Shared & { name: StringField; label: string; hint?: string; rows?: number }) {
  const error = errors[name];
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <Textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={values[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </FieldShell>
  );
}

function SelectField({
  name,
  label,
  hint,
  values,
  errors,
  children,
}: Shared & {
  name: StringField;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const error = errors[name];
  return (
    <FieldShell name={name} label={label} hint={hint} error={error}>
      <select
        id={name}
        name={name}
        defaultValue={values[name]}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={controlClass}
      >
        {children}
      </select>
    </FieldShell>
  );
}

function CheckboxField({
  name,
  label,
  hint,
  values,
}: {
  name: CheckboxName;
  label: string;
  hint: string;
  values: ProductFormValues;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={values[name]}
        className="mt-0.5 size-4 accent-gold-deep"
      />
      <span>
        <span className="font-medium">{label}</span>
        <br />
        <span className="text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

const legendClass =
  "mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground";

export function ProductForm({
  action,
  initial,
  categories,
  submitLabel,
}: {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  initial?: ProductFormValues;
  categories: CategoryOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  // After a failed save, keep whatever the admin had typed
  const values = state.values ?? initial ?? emptyProductValues;
  const errors = state.errors ?? {};
  const shared = { values, errors };

  return (
    <form action={formAction} className="space-y-12">
      {state.message && (
        <p
          role="alert"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <fieldset className="space-y-6">
        <legend className={legendClass}>The artwork</legend>
        <TextField {...shared} name="name" label="Name" required />
        <TextField
          {...shared}
          name="slug"
          label="Slug"
          placeholder="Leave blank to create it from the name"
          hint="The page address, for example /products/golden-horizon."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField {...shared} name="categoryId" label="Category">
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            {...shared}
            name="subcategoryId"
            label="Subcategory (optional)"
          >
            <option value="">None</option>
            {categories
              .filter((category) => category.subcategories.length > 0)
              .map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {category.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
          </SelectField>
        </div>
        <TextField {...shared} name="artist" label="Artist" />
        <AreaField
          {...shared}
          name="shortDescription"
          label="Short description"
          rows={2}
          hint="One or two sentences, shown on cards and in search results."
        />
        <AreaField {...shared} name="description" label="Description" rows={6} />
      </fieldset>

      <fieldset className="space-y-6 border-t border-border pt-10">
        <legend className={legendClass}>Details</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField {...shared} name="material" label="Material" />
          <TextField {...shared} name="medium" label="Medium" />
          <TextField
            {...shared}
            name="yearCreated"
            label="Year created"
            inputMode="numeric"
          />
          <TextField
            {...shared}
            name="tags"
            label="Tags"
            hint="Separate with commas, for example abstract, gold, large."
          />
        </div>
      </fieldset>

      <fieldset className="space-y-6 border-t border-border pt-10">
        <legend className={legendClass}>Authenticity</legend>
        <div className="grid gap-6 sm:grid-cols-3">
          <SelectField {...shared} name="artworkType" label="Type">
            <option value="ORIGINAL">Original</option>
            <option value="PRINT">Print</option>
          </SelectField>
          <TextField
            {...shared}
            name="editionNumber"
            label="Edition number"
            inputMode="numeric"
          />
          <TextField
            {...shared}
            name="totalEditions"
            label="Total editions"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-4">
          <CheckboxField
            name="hasCertificate"
            values={values}
            label="Certificate of authenticity included"
            hint="Shown to customers on the product page."
          />
          <CheckboxField
            name="isSigned"
            values={values}
            label="Signed by the artist"
            hint="Shown to customers on the product page."
          />
        </div>
        <AreaField
          {...shared}
          name="provenance"
          label="Provenance"
          rows={3}
          hint="Where the work has been exhibited or who has owned it."
        />
      </fieldset>

      <fieldset className="space-y-6 border-t border-border pt-10">
        <legend className={legendClass}>Price and stock</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField {...shared} name="sku" label="SKU" required />
          <TextField
            {...shared}
            name="stock"
            label="Stock"
            inputMode="numeric"
            hint="A one-of-a-kind original has a stock of 1."
          />
          <TextField
            {...shared}
            name="price"
            label="Price (PKR)"
            inputMode="decimal"
            required
          />
          <TextField
            {...shared}
            name="salePrice"
            label="Sale price (optional)"
            inputMode="decimal"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Size and weight, used for delivery:
        </p>
        <div className="grid gap-6 sm:grid-cols-4">
          <TextField {...shared} name="widthCm" label="Width (cm)" inputMode="decimal" />
          <TextField {...shared} name="heightCm" label="Height (cm)" inputMode="decimal" />
          <TextField {...shared} name="depthCm" label="Depth (cm)" inputMode="decimal" />
          <TextField {...shared} name="weightGrams" label="Weight (g)" inputMode="numeric" />
        </div>
      </fieldset>

      <fieldset className="space-y-6 border-t border-border pt-10">
        <legend className={legendClass}>Publishing</legend>
        <SelectField
          {...shared}
          name="status"
          label="Status"
          hint="Only Active products will appear on the website."
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </SelectField>
        <CheckboxField
          name="isFeatured"
          values={values}
          label="Featured"
          hint="Featured products can be shown on the homepage."
        />
      </fieldset>

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href="/admin/products"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}