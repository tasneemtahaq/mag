import type { Metadata } from "next";
import {
  createSubcategory,
  deleteSubcategory,
  updateSubcategory,
} from "@/actions/catalog/subcategory-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSubcategoryGroups } from "@/lib/data/admin-catalog";

export const metadata: Metadata = { title: "Subcategories" };

const errorMessages: Record<string, string> = {
  invalid: "Please enter a name (up to 60 characters) and a whole number for the order.",
  duplicate: "This category already has a subcategory with that name.",
  "in-use":
    "Products still use this subcategory, so it can't be deleted. Untick Visible to hide it instead, or move those products first.",
};

export default async function AdminSubcategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const groups = await getAdminSubcategoryGroups();

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl font-light">Subcategories</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Optional groupings inside a category, for example Landscape and Portrait
        inside Oil Paintings. A category doesn&rsquo;t need any.
      </p>

      {error && errorMessages[error] && (
        <p
          role="alert"
          className="mt-6 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessages[error]}
        </p>
      )}

      <div className="mt-10 space-y-14">
        {groups.map((category) => (
          <section key={category.id} aria-labelledby={`category-${category.id}`}>
            <h2
              id={`category-${category.id}`}
              className="font-display text-2xl font-light"
            >
              {category.name}
            </h2>

            <div className="mt-4 space-y-3">
              {category.subcategories.map((sub) => (
                <form
                  key={sub.id}
                  action={updateSubcategory}
                  className="flex flex-wrap items-end gap-4 border border-border p-4"
                >
                  <input type="hidden" name="id" value={sub.id} />
                  <div className="min-w-48 flex-1">
                    <Label htmlFor={`${sub.id}-name`}>Name</Label>
                    <Input
                      id={`${sub.id}-name`}
                      name="name"
                      defaultValue={sub.name}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`${sub.id}-order`}>Order</Label>
                    <Input
                      id={`${sub.id}-order`}
                      name="sortOrder"
                      inputMode="numeric"
                      defaultValue={String(sub.sortOrder)}
                      className="mt-2"
                    />
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={sub.isActive}
                      className="size-4 accent-gold-deep"
                    />
                    Visible
                  </label>
                  <span className="pb-2 text-xs text-muted-foreground">
                    {sub._count.products} product
                    {sub._count.products === 1 ? "" : "s"}
                  </span>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" variant="outline">
                      Save
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      formAction={deleteSubcategory}
                      formNoValidate
                    >
                      Delete
                    </Button>
                  </div>
                </form>
              ))}

              {category.subcategories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No subcategories yet.
                </p>
              )}

              <form
                action={createSubcategory}
                className="flex flex-wrap items-end gap-4 border border-dashed border-border p-4"
              >
                <input type="hidden" name="categoryId" value={category.id} />
                <div className="min-w-48 flex-1">
                  <Label htmlFor={`new-${category.id}`}>Add a subcategory</Label>
                  <Input
                    id={`new-${category.id}`}
                    name="name"
                    placeholder="For example Landscape"
                    required
                    className="mt-2"
                  />
                </div>
                <Button type="submit">Add</Button>
              </form>
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <p className="text-muted-foreground">
            Create a category first. Subcategories live inside categories.
          </p>
        )}
      </div>
    </div>
  );
}