"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyVariantValues } from "@/lib/validation/variant";
import type {
  VariantFieldName,
  VariantFormState,
  VariantFormValues,
} from "@/lib/validation/variant";

export type SizeOption = { id: string; name: string };

type TextFieldName = Exclude<VariantFieldName, "isActive" | "sizeId">;
type Errors = NonNullable<VariantFormState["errors"]>;

const controlClass =
  "mt-2 flex h-10 w-full border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function Field({
  prefix,
  name,
  label,
  hint,
  inputMode,
  values,
  errors,
}: {
  prefix: string;
  name: TextFieldName;
  label: string;
  hint?: string;
  inputMode?: "text" | "decimal" | "numeric";
  values: VariantFormValues;
  errors: Errors;
}) {
  // Several variant forms share one page, so every id needs its own prefix
  const id = `${prefix}-${name}`;
  const error = errors[name];
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        defaultValue={values[name]}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2"
      />
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function VariantForm({
  action,
  initial,
  sizes,
  submitLabel,
  savedText,
  prefix,
}: {
  action: (
    state: VariantFormState,
    formData: FormData,
  ) => Promise<VariantFormState>;
  initial?: VariantFormValues;
  sizes: SizeOption[];
  submitLabel: string;
  savedText: string;
  prefix: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  const values = state.values ?? initial ?? emptyVariantValues;
  const errors = state.errors ?? {};
  const shared = { prefix, values, errors };

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <p
          role="alert"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        <Field {...shared} name="name" label="Variant name" />
        <Field {...shared} name="sku" label="SKU" />
        <div>
          <Label htmlFor={`${prefix}-sizeId`}>Size (optional)</Label>
          <select
            id={`${prefix}-sizeId`}
            name="sizeId"
            defaultValue={values.sizeId}
            className={controlClass}
          >
            <option value="">No size</option>
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
          {errors.sizeId && (
            <p className="mt-1.5 text-sm text-destructive">{errors.sizeId}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Field {...shared} name="price" label="Price (PKR)" inputMode="decimal" />
        <Field
          {...shared}
          name="salePrice"
          label="Sale price (optional)"
          inputMode="decimal"
        />
        <Field
          {...shared}
          name="stock"
          label="Stock"
          inputMode="numeric"
          hint="A one-of-a-kind original has a stock of 1."
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <Field {...shared} name="widthCm" label="Width (cm)" inputMode="decimal" />
        <Field {...shared} name="heightCm" label="Height (cm)" inputMode="decimal" />
        <Field {...shared} name="depthCm" label="Depth (cm)" inputMode="decimal" />
        <Field {...shared} name="weightGrams" label="Weight (g)" inputMode="numeric" />
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={values.isActive}
          className="mt-0.5 size-4 accent-gold-deep"
        />
        <span>
          <span className="font-medium">Available for sale</span>
          <br />
          <span className="text-muted-foreground">
            Untick to hide this variant from customers.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {state.saved && !pending && (
          <p role="status" className="text-sm text-muted-foreground">
            {savedText}
          </p>
        )}
      </div>
    </form>
  );
}