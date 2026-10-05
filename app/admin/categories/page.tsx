import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
  moveCategory,
  restoreCategory,
  setCategoryActive,
} from "@/actions/categories/admin-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminCategories } from "@/lib/data/admin-categories";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Categories" };

const small = buttonVariants({ variant: "outline", size: "sm" });
const iconButton = buttonVariants({ variant: "ghost", size: "icon" });

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  const live = categories.filter((category) => !category.archivedAt);
  const archived = categories.filter((category) => category.archivedAt);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-light">Categories</h1>
        <Link href="/admin/categories/new" className={buttonVariants()}>
          <Plus className="size-4" />
          New category
        </Link>
      </div>

      <div className="mt-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {live.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="flex">
                    <form action={moveCategory}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        aria-label={`Move ${category.name} up`}
                        className={cn(iconButton, "disabled:opacity-30")}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                    </form>
                    <form action={moveCategory}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === live.length - 1}
                        aria-label={`Move ${category.name} down`}
                        className={cn(iconButton, "disabled:opacity-30")}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </form>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="hover:underline"
                  >
                    {category.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.slug}
                </TableCell>
                <TableCell className="text-right">
                  {category._count.products}
                </TableCell>
                <TableCell>
                  <Badge variant={category.isActive ? "secondary" : "outline"}>
                    {category.isActive ? "Visible" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <form action={setCategoryActive}>
                      <input type="hidden" name="id" value={category.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={String(!category.isActive)}
                      />
                      <button type="submit" className={small}>
                        {category.isActive ? "Hide" : "Show"}
                      </button>
                    </form>
                    <Link
                      href={`/admin/categories/${category.id}/edit`}
                      className={small}
                    >
                      Edit
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {live.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No categories yet. Create the first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {archived.length > 0 && (
        <section aria-labelledby="archived" className="mt-16">
          <h2 id="archived" className="font-display text-2xl font-light">
            Archived
          </h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {archived.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {category.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {category._count.products} products
                  </p>
                </div>
                <form action={restoreCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <button type="submit" className={small}>
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}