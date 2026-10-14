"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { emptyDiscountValues } from "@/lib/validation/discount";
import type {
  DiscountFieldName,
  DiscountFormState,
  DiscountFormValues,
} from "@/lib/validation/discount";

type Errors = NonNullable<DiscountFormState["errors"]>;

const controlClass =
  "flex h-10 w-full border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function Field({
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

export function DiscountForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    state: DiscountFormState,
    formData: FormData,
  ) => Promise<DiscountFormState>;
  initial?: DiscountFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  // After a failed save, keep whatever the admin had typed
  const values = state.values ?? initial ?? emptyDiscountValues;
  const errors: Errors = state.errors ?? {};

  // The label of the amount box depends on the kind of discount
  const [type, setType] = useState(values.type);
  const percentage = type === "PERCENTAGE";

  const aria = (field: DiscountFieldName) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <form action={formAction} className="space-y-8">
      {state.message && (
        <p
          role="alert"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          name="code"
          label="Code"
          error={errors.code}
          hint="What the customer types, for example WELCOME10. Letters are saved in capitals."
        >
          <Input
            id="code"
            name="code"
            defaultValue={values.code}
            autoCapitalize="characters"
            autoComplete="off"
            required
            {...aria("code")}
          />
        </Field>
        <Field name="description" label="Note for yourself (optional)" error={errors.description}>
          <Input
            id="description"
            name="description"
            defaultValue={values.description}
            {...aria("description")}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field name="type" label="Kind of discount" error={errors.type}>
          <select
            id="type"
            name="type"
            defaultValue={values.type}
            onChange={(event) =>
              setType(event.target.value as DiscountFormValues["type"])
            }
            className={controlClass}
          >
            <option value="PERCENTAGE">A percentage off the artwork</option>
            <option value="FIXED">A fixed amount off the artwork</option>
          </select>
        </Field>
        <Field
          name="value"
          label={percentage ? "Percentage off (1 to 100)" : "Amount off (PKR)"}
          error={errors.value}
          hint="Applied to the artwork total, not to delivery."
        >
          <Input
            id="value"
            name="value"
            inputMode="decimal"
            defaultValue={values.value}
            required
            {...aria("value")}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          name="minOrderAmount"
          label="Minimum order (PKR, optional)"
          error={errors.minOrderAmount}
          hint="Measured before the discount is taken off."
        >
          <Input
            id="minOrderAmount"
            name="minOrderAmount"
            inputMode="decimal"
            defaultValue={values.minOrderAmount}
            {...aria("minOrderAmount")}
          />
        </Field>
        <Field
          name="maxUses"
          label="Maximum uses (optional)"
          error={errors.maxUses}
          hint="Leave blank for no limit. Counted across all customers."
        >
          <Input
            id="maxUses"
            name="maxUses"
            inputMode="numeric"
            defaultValue={values.maxUses}
            {...aria("maxUses")}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          name="startsAt"
          label="First day (optional)"
          error={errors.startsAt}
          hint="Pakistan time. Blank means it works straight away."
        >
          <Input
            id="startsAt"
            name="startsAt"
            type="date"
            defaultValue={values.startsAt}
            {...aria("startsAt")}
          />
        </Field>
        <Field
          name="endsAt"
          label="Last day (optional)"
          error={errors.endsAt}
          hint="Pakistan time. This day is included. Blank means no end."
        >
          <Input
            id="endsAt"
            name="endsAt"
            type="date"
            defaultValue={values.endsAt}
            {...aria("endsAt")}
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={values.isActive}
          className="mt-0.5 size-4 accent-gold-deep"
        />
        <span>
          <span className="font-medium">Switched on</span>
          <br />
          <span className="text-muted-foreground">
            Untick to stop customers using this code, without deleting it.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href="/admin/discounts"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}