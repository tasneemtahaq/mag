import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  archiveCategory,
  deleteCategory,
  restoreCategory,
  updateCategory,
} from "@/actions/categories/admin-actions";
import { CategoryForm } from "@/components/admin/category-form";
import { Button } from "@/components/ui/button";
import { getAdminCategory } from "@/lib/data/admin-categories";

export const metadata: Metadata = { title: "Edit category" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditCategoryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;

  const category = await getAdminCategory(id);
  if (!category) notFound();

  const productCount = category._count.products;

  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Link href="/admin/categories" className="hover:text-foreground">
          Categories
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl font-light">{category.name}</h1>

      {category.archivedAt && (
        <p className="mt-4 border border-border bg-muted px-4 py-3 text-sm">
          This category is archived. It is hidden from the website.
        </p>
      )}

      {error === "has-products" && (
        <p
          role="alert"
          className="mt-4 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          This category still contains {productCount} product
          {productCount === 1 ? "" : "s"}, so it can&rsquo;t be deleted. Archive
          it instead, or move its products elsewhere first.
        </p>
      )}

      <div className="mt-10">
        <CategoryForm
          action={updateCategory.bind(null, category.id)}
          submitLabel="Save changes"
          initial={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            seoTitle: category.seoTitle ?? "",
            seoDescription: category.seoDescription ?? "",
            isActive: category.isActive,
          }}
        />
      </div>

      {category.subcategories.length > 0 && (
        <section aria-labelledby="subs" className="mt-16 border-t border-border pt-10">
          <h2 id="subs" className="font-display text-2xl font-light">
            Subcategories
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Managing subcategories arrives with the product screens in Phase 10.
          </p>
          <ul className="mt-4 list-inside list-disc text-sm">
            {category.subcategories.map((sub) => (
              <li key={sub.id}>{sub.name}</li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby="danger"
        className="mt-16 space-y-10 border-t border-border pt-10"
      >
        <h2 id="danger" className="font-display text-2xl font-light">
          Archive or delete
        </h2>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Archiving hides the category but keeps everything, so it can be
            restored later. This is the safe choice.
          </p>
          {category.archivedAt ? (
            <form action={restoreCategory}>
              <input type="hidden" name="id" value={category.id} />
              <Button type="submit" variant="outline">
                Restore category
              </Button>
            </form>
          ) : (
            <form action={archiveCategory}>
              <input type="hidden" name="id" value={category.id} />
              <Button type="submit" variant="outline">
                Archive category
              </Button>
            </form>
          )}
        </div>

        <form action={deleteCategory} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />
          <p className="text-sm text-muted-foreground">
            Deleting is permanent. It also deletes the category&rsquo;s
            subcategories. A category that still has products can&rsquo;t be
            deleted.
          </p>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="confirm"
              required
              className="mt-0.5 size-4 accent-destructive"
            />
            <span>I understand this cannot be undone.</span>
          </label>
          <Button
            type="submit"
            variant="destructive"
            disabled={productCount > 0}
          >
            Delete category
          </Button>
        </form>
      </section>
    </div>
  );
}