import type { Metadata } from "next";
import {
  createSize,
  deleteSize,
  updateSize,
} from "@/actions/catalog/size-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSizes } from "@/lib/data/admin-catalog";

export const metadata: Metadata = { title: "Sizes" };

const errorMessages: Record<string, string> = {
  invalid:
    "Please check the name and the numbers. Sizes are in centimetres, like 60 or 60.5.",
  duplicate: "A size with this name already exists.",
  "in-use":
    "This size is used by one or more variants, so it can't be deleted. Untick Available to hide it instead.",
};

function SizeFields({
  prefix,
  size,
}: {
  prefix: string;
  size?: {
    name: string;
    widthCm: { toString(): string } | null;
    heightCm: { toString(): string } | null;
    depthCm: { toString(): string } | null;
    sortOrder: number;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <div className="sm:col-span-2">
        <Label htmlFor={`${prefix}-name`}>Name</Label>
        <Input
          id={`${prefix}-name`}
          name="name"
          defaultValue={size?.name ?? ""}
          placeholder="For example Medium or 18 × 24 in"
          required
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-w`}>Width (cm)</Label>
        <Input
          id={`${prefix}-w`}
          name="widthCm"
          inputMode="decimal"
          defaultValue={size?.widthCm?.toString() ?? ""}
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-h`}>Height (cm)</Label>
        <Input
          id={`${prefix}-h`}
          name="heightCm"
          inputMode="decimal"
          defaultValue={size?.heightCm?.toString() ?? ""}
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-d`}>Depth (cm)</Label>
        <Input
          id={`${prefix}-d`}
          name="depthCm"
          inputMode="decimal"
          defaultValue={size?.depthCm?.toString() ?? ""}
          className="mt-2"
        />
      </div>
      <div>
        <Label htmlFor={`${prefix}-order`}>Order</Label>
        <Input
          id={`${prefix}-order`}
          name="sortOrder"
          inputMode="numeric"
          defaultValue={String(size?.sortOrder ?? 0)}
          className="mt-2"
        />
      </div>
    </div>
  );
}

export default async function AdminSizesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const sizes = await getAdminSizes();

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-light">Sizes</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Reusable size labels. When you add a variant to a product, you pick one
        from this list.
      </p>

      {error && errorMessages[error] && (
        <p
          role="alert"
          className="mt-6 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessages[error]}
        </p>
      )}

      <section aria-labelledby="add-size" className="mt-10">
        <h2 id="add-size" className="mb-4 font-display text-2xl font-light">
          Add a size
        </h2>
        <form action={createSize} className="space-y-4 border border-dashed border-border p-4">
          <SizeFields prefix="new-size" />
          <Button type="submit">Add size</Button>
        </form>
      </section>

      <section aria-labelledby="all-sizes" className="mt-14">
        <h2 id="all-sizes" className="mb-4 font-display text-2xl font-light">
          All sizes
        </h2>
        <div className="space-y-4">
          {sizes.map((size) => (
            <form
              key={size.id}
              action={updateSize}
              className="space-y-4 border border-border p-4"
            >
              <input type="hidden" name="id" value={size.id} />
              <SizeFields prefix={size.id} size={size} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={size.isActive}
                    className="size-4 accent-gold-deep"
                  />
                  Available
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Used by {size._count.variants} variant
                    {size._count.variants === 1 ? "" : "s"}
                  </span>
                  <Button type="submit" size="sm" variant="outline">
                    Save
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    formAction={deleteSize}
                    formNoValidate
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </form>
          ))}
          {sizes.length === 0 && (
            <p className="text-muted-foreground">No sizes yet. Add the first one above.</p>
          )}
        </div>
      </section>
    </div>
  );
}