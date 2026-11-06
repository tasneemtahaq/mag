import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getDashboardData } from "@/lib/data/admin-dashboard";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, orderBadgeVariant } from "@/lib/order-labels";

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
  value: string | number;
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
      <p className="mt-3 font-display text-4xl font-light sm:text-5xl">{value}</p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
    const { withoutPhotos, withoutVariants, soldOut, receiptsToCheck, awaitingPayment } =
    data.attention;

  const attention = [
        receiptsToCheck > 0 && {
      text: `${receiptsToCheck} payment ${receiptsToCheck === 1 ? "receipt is" : "receipts are"} waiting for you to check.`,
      href: "/admin/payments",
    },
    awaitingPayment > 0 && {
      text: `${awaitingPayment} ${awaitingPayment === 1 ? "order is" : "orders are"} waiting for the customer to pay.`,
      href: "/admin/payments",
    },
    data.orders.new > 0 && {
      text: `${data.orders.new} new ${data.orders.new === 1 ? "order is" : "orders are"} waiting for you.`,
      href: "/admin/orders?status=PENDING",
    },
    withoutPhotos > 0 && {
      text: `${withoutPhotos} active ${withoutPhotos === 1 ? "product has" : "products have"} no photo.`,
      href: "/admin/products?status=ACTIVE",
    },
    withoutVariants > 0 && {
      text: `${withoutVariants} active ${withoutVariants === 1 ? "product has" : "products have"} no available variant, so customers can't see ${withoutVariants === 1 ? "it" : "them"}.`,
      href: "/admin/products?status=ACTIVE",
    },
    soldOut > 0 && {
      text: `${soldOut} active ${soldOut === 1 ? "product is" : "products are"} sold out.`,
      href: "/admin/products?status=ACTIVE",
    },
  ].filter((item): item is { text: string; href: string } => Boolean(item));

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

      <section aria-labelledby="needs-heading" className="mt-12">
        <h2 id="needs-heading" className="font-display text-2xl font-light">
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Everything looks good.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {attention.map((item) => (
              <li
                key={item.text}
                className="flex flex-wrap items-center justify-between gap-3 border border-border px-4 py-3 text-sm"
              >
                <span>{item.text}</span>
                <Link
                  href={item.href}
                  className="text-xs uppercase tracking-[0.15em] underline-offset-8 hover:underline"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="orders-heading" className="mt-12">
        <h2 id="orders-heading" className="font-display text-2xl font-light">
          Orders
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="New orders"
            value={data.orders.new}
            href="/admin/orders?status=PENDING"
          />
          <StatCard
            label="Orders this month"
            value={data.orders.thisMonth}
            href="/admin/orders"
          />
          <StatCard
            label="Sales this month"
            value={formatPrice(data.orders.salesThisMonth)}
            href="/admin/orders"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Sales add up orders that are not cancelled or refunded, whether or not
          the cash on delivery has been collected yet.
        </p>

        {data.orders.recent.length > 0 && (
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {data.orders.recent.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium hover:underline"
                  >
                    {formatOrderNumber(order.number)}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {order.customerName} · {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">
                    {formatPrice(order.total.toNumber())}
                  </span>
                  <Badge variant={orderBadgeVariant(order.status)}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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

        {data.recent.length > 0 && (
          <ul className="mt-6 divide-y divide-border border-y border-border">
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
                    {product.category.name} · {formatDateTime(product.createdAt)}
                  </p>
                </div>
                <Badge variant={product.status === "ACTIVE" ? "secondary" : "outline"}>
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
          <StatCard label="Visible" value={data.categories.active} href="/admin/categories" />
          <StatCard label="Hidden" value={data.categories.hidden} href="/admin/categories" />
          <StatCard label="Archived" value={data.categories.archived} href="/admin/categories" />
        </div>
      </section>
    </div>
  );
}