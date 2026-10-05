"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  CategoryFieldName,
  CategoryFormState,
  CategoryFormValues,
} from "@/lib/validation/category";

const emptyValues: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  isActive: true,
};

type Props = {
  action: (
    state: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  initial?: CategoryFormValues;
  submitLabel: string;
};

export function CategoryForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  // After a failed save, keep whatever the admin had typed
  const values = state.values ?? initial ?? emptyValues;
  const errors = state.errors ?? {};

  const fieldProps = (field: CategoryFieldName) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  const errorText = (field: CategoryFieldName) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-1.5 text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null;

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

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={values.name}
          required
          className="mt-2"
          {...fieldProps("name")}
        />
        {errorText("name")}
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={values.slug}
          placeholder="Leave blank to create it from the name"
          className="mt-2"
          {...fieldProps("slug")}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          The page address, for example /shop/oil-paintings. Changing it later
          changes the page&rsquo;s address.
        </p>
        {errorText("slug")}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={values.description}
          className="mt-2"
          {...fieldProps("description")}
        />
        {errorText("description")}
      </div>

      <fieldset className="space-y-6 border-t border-border pt-8">
        <legend className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Search engines (optional)
        </legend>
        <div>
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input
            id="seoTitle"
            name="seoTitle"
            defaultValue={values.seoTitle}
            className="mt-2"
            {...fieldProps("seoTitle")}
          />
          {errorText("seoTitle")}
        </div>
        <div>
          <Label htmlFor="seoDescription">SEO description</Label>
          <Textarea
            id="seoDescription"
            name="seoDescription"
            rows={3}
            defaultValue={values.seoDescription}
            className="mt-2"
            {...fieldProps("seoDescription")}
          />
          {errorText("seoDescription")}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={values.isActive}
          className="mt-0.5 size-4 accent-gold-deep"
        />
        <span>
          <span className="font-medium">Visible on the website</span>
          <br />
          <span className="text-muted-foreground">
            Turn this off to hide the category from the menu and the shop. You
            can turn it back on at any time.
          </span>
        </span>
      </label>

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link
          href="/admin/categories"
          className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}