import Link from "next/link";
import { ProductGrid } from "@/components/products/product-grid";
import {
  DEFAULT_SORT,
  getProductsPage,
  parsePage,
  parseSort,
  productSorts,
} from "@/lib/data/products";
import type { ProductSort } from "@/lib/data/products";
import { cn } from "@/lib/utils";

// Builds an address like /shop?sort=price-asc&page=2 (leaving out the defaults)
function hrefFor(basePath: string, sort: ProductSort, page: number) {
  const query = new URLSearchParams();
  if (sort !== DEFAULT_SORT) query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `${basePath}?${text}` : basePath;
}

const pagerLink =
  "border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors hover:border-ink";

export async function ProductListing({
  basePath,
  categorySlug,
  sort: sortParam,
  page: pageParam,
}: {
  basePath: string;
  categorySlug?: string;
  sort?: string;
  page?: string;
}) {
  const sort = parseSort(sortParam);
  const result = await getProductsPage({
    categorySlug,
    sort,
    page: parsePage(pageParam),
  });

  if (result.total === 0) {
    return (
      <p className="border-t border-border pt-10 text-muted-foreground">
        No artwork to show here yet. Please check back soon.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
        <p className="text-sm text-muted-foreground">
          {result.total} {result.total === 1 ? "artwork" : "artworks"}
        </p>
        <nav aria-label="Sort artwork">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {productSorts.map((option) => (
              <li key={option.value}>
                <Link
                  href={hrefFor(basePath, option.value, 1)}
                  aria-current={option.value === sort ? "true" : undefined}
                  className={cn(
                    "text-xs uppercase tracking-[0.15em] transition-colors hover:text-foreground",
                    option.value === sort
                      ? "text-foreground underline underline-offset-8"
                      : "text-muted-foreground",
                  )}
                >
                  {option.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-10">
        <ProductGrid products={result.products} priorityCount={3} />
      </div>

      {result.pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-16 flex items-center justify-center gap-6"
        >
          {result.page > 1 ? (
            <Link href={hrefFor(basePath, sort, result.page - 1)} className={pagerLink}>
              Previous
            </Link>
          ) : (
            <span className={cn(pagerLink, "opacity-30")}>Previous</span>
          )}
          <span className="text-sm text-muted-foreground">
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount ? (
            <Link href={hrefFor(basePath, sort, result.page + 1)} className={pagerLink}>
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