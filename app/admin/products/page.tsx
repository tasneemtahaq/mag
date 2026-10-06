import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  duplicateProduct,
  setProductStatus,
} from "@/actions/products/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminProductsPage,
  getProductFormOptions,
} from "@/lib/data/admin-products";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Products" };

const small = buttonVariants({ variant: "outline", size: "sm" });
const selectClass =
  "mt-2 flex h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const statusLabel = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
} as const;

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

// Builds an address like /admin/products?q=gold&page=2
function hrefFor(filters: Record<string, string>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/admin/products?${text}` : "/admin/products";
}

const pagerLink =
  "border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors hover:border-ink";

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const q = (params.q ?? "").trim().slice(0, 80);
  const categoryId = params.category ?? "";
  const status = params.status ?? "";
  const sort = params.sort ?? "";
  const pageNumber = Number(params.page);

  const [result, categories] = await Promise.all([
    getAdminProductsPage({
      q,
      categoryId,
      status,
      sort,
      page: Number.isInteger(pageNumber) ? pageNumber : 1,
    }),
    getProductFormOptions(),
  ]);

  const filters = { q, category: categoryId, status, sort };
  const hasFilters = Boolean(q || categoryId || status || sort);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-light">Products</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          <Plus className="size-4" />
          New product
        </Link>
      </div>

      {/* A plain web form: it works without JavaScript */}
      <form
        action="/admin/products"
        method="get"
        className="mt-8 grid gap-4 border border-border p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name, artist, SKU, tag, material..."
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={categoryId}
            className={selectClass}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className={selectClass}
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div>
          <Label htmlFor="sort">Sort by</Label>
          <select id="sort" name="sort" defaultValue={sort} className={selectClass}>
            <option value="">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name A to Z</option>
          </select>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-5">
          <Button type="submit">Apply</Button>
          {hasFilters && (
            <Link
              href="/admin/products"
              className={buttonVariants({ variant: "ghost" })}
            >
              Clear
            </Link>
          )}
          <span className="ml-auto text-sm text-muted-foreground">
            {result.total} product{result.total === 1 ? "" : "s"}
          </span>
        </div>
      </form>

      <div className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Photo</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.products.map((product) => {
              const prices = product.variants.map((variant) =>
                (variant.salePrice ?? variant.price).toNumber(),
              );
              const lowest = prices.length > 0 ? Math.min(...prices) : null;
              const stock = product.variants.reduce(
                (sum, item) => sum + item.stock,
                0,
              );
              const photo = product.images[0];
              const nextStatus =
                product.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {photo ? (
                      <Image
                        src={photo.url}
                        alt={photo.alt ?? product.name}
                        width={56}
                        height={56}
                        className="size-14 object-cover"
                      />
                    ) : (
                      <div className="size-14 bg-muted" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.isFeatured && (
                      <span className="ml-2 text-xs text-gold-deep">
                        Featured
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {lowest === null ? (
                      <span className="text-xs text-destructive">No variant</span>
                    ) : (
                      <>
                        {prices.length > 1 && (
                          <span className="text-muted-foreground">From </span>
                        )}
                        {formatPrice(lowest)}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{stock}</TableCell>
                  <TableCell>
                    <Badge
                      variant={product.status === "ACTIVE" ? "secondary" : "outline"}
                    >
                      {statusLabel[product.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <form action={setProductStatus}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="status" value={nextStatus} />
                        <button type="submit" className={small}>
                          {product.status === "ACTIVE" ? "Archive" : "Activate"}
                        </button>
                      </form>
                      <form action={duplicateProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className={small}>
                          Duplicate
                        </button>
                      </form>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className={small}
                      >
                        Edit
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {result.products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  {hasFilters
                    ? "No products match these filters."
                    : "No products yet. Create the first one."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {result.pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-10 flex items-center justify-center gap-6"
        >
          {result.page > 1 ? (
            <Link href={hrefFor(filters, result.page - 1)} className={pagerLink}>
              Previous
            </Link>
          ) : (
            <span className={cn(pagerLink, "opacity-30")}>Previous</span>
          )}
          <span className="text-sm text-muted-foreground">
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount ? (
            <Link href={hrefFor(filters, result.page + 1)} className={pagerLink}>
              Next
            </Link>
          ) : (
            <span className={cn(pagerLink, "opacity-30")}>Next</span>
          )}
        </nav>
      )}
    </div>
  );
}