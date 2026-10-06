import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardData } from "@/lib/data/admin-dashboard";

export const metadata: Metadata = { title: "Dashboard" };

const statusLabel = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
} as const;

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-border p-6 transition-colors hover:bg-accent/50"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-display text-5xl font-light">{value}</p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const { withoutPhotos, withoutVariants, soldOut } = data.attention;

  const attention = [
    withoutPhotos > 0 &&
      `${withoutPhotos} active ${withoutPhotos === 1 ? "product has" : "products have"} no photo.`,
    withoutVariants > 0 &&
      `${withoutVariants} active ${withoutVariants === 1 ? "product has" : "products have"} no available variant, so customers can't see ${withoutVariants === 1 ? "it" : "them"}.`,
    soldOut > 0 &&
      `${soldOut} active ${soldOut === 1 ? "product is" : "products are"} sold out.`,
  ].filter((item): item is string => Boolean(item));

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-light">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/admin/products/new" className={buttonVariants()}>
            <Plus className="size-4" />
            New product
          </Link>
          <Link
            href="/admin/categories/new"
            className={buttonVariants({ variant: "outline" })}
          >
            New category
          </Link>
        </div>
      </div>

      <section aria-labelledby="products-heading" className="mt-12">
        <h2 id="products-heading" className="font-display text-2xl font-light">
          Products
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active"
            value={data.products.active}
            href="/admin/products?status=ACTIVE"
          />
          <StatCard
            label="Drafts"
            value={data.products.draft}
            href="/admin/products?status=DRAFT"
          />
          <StatCard
            label="Archived"
            value={data.products.archived}
            href="/admin/products?status=ARCHIVED"
          />
        </div>
      </section>

      <section aria-labelledby="attention-heading" className="mt-12">
        <h2 id="attention-heading" className="font-display text-2xl font-light">
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Everything looks good.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {attention.map((message) => (
              <li
                key={message}
                className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3 text-sm"
              >
                <span>{message}</span>
                <Link
                  href="/admin/products?status=ACTIVE"
                  className="text-xs uppercase tracking-[0.15em] underline-offset-8 hover:underline"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-heading" className="mt-12">
        <h2 id="recent-heading" className="font-display text-2xl font-light">
          Recently added
        </h2>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No products yet. Create the first one.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {data.recent.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {product.category.name} ·{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                    }).format(product.createdAt)}
                  </p>
                </div>
                <Badge
                  variant={product.status === "ACTIVE" ? "secondary" : "outline"}
                >
                  {statusLabel[product.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="categories-heading" className="mt-12">
        <h2 id="categories-heading" className="font-display text-2xl font-light">
          Categories
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Visible"
            value={data.categories.active}
            href="/admin/categories"
          />
          <StatCard
            label="Hidden"
            value={data.categories.hidden}
            href="/admin/categories"
          />
          <StatCard
            label="Archived"
            value={data.categories.archived}
            href="/admin/categories"
          />
        </div>
      </section>

      <p className="mt-12 text-sm text-muted-foreground">
        Orders, customers and revenue will appear here once checkout and
        payments are built.
      </p>
    </div>
  );
}