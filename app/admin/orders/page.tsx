import type { Metadata } from "next";
import Link from "next/link";
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
  getAdminOrdersPage,
  getOrderStatusCounts,
} from "@/lib/data/admin-orders";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_LABEL,
  orderBadgeVariant,
  paymentProviderLabel,
} from "@/lib/order-labels";
import type { OrderStatusValue } from "@/lib/order-labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders" };

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

function hrefFor(filters: { q: string; status: string }, page: number) {
  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.status) query.set("status", filters.status);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/admin/orders?${text}` : "/admin/orders";
}

const pagerLink =
  "border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors hover:border-ink";

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;

  const q = (params.q ?? "").trim().slice(0, 80);
  const status: OrderStatusValue | "" = ORDER_STATUS_VALUES.includes(
    params.status as OrderStatusValue,
  )
    ? (params.status as OrderStatusValue)
    : "";
  const pageNumber = Number(params.page);

  const [result, counts] = await Promise.all([
    getAdminOrdersPage({
      q,
      status,
      page: Number.isInteger(pageNumber) ? pageNumber : 1,
    }),
    getOrderStatusCounts(),
  ]);

  const allCount = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const tabs = [
    { value: "", label: "All", count: allCount },
    ...ORDER_STATUS_VALUES.map((value) => ({
      value,
      label: ORDER_STATUS_LABEL[value],
      count: counts[value],
    })),
  ];
  const filters = { q, status };

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-4xl font-light">Orders</h1>

      <nav aria-label="Order status" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <li key={tab.value || "all"}>
              <Link
                href={hrefFor({ q, status: tab.value }, 1)}
                aria-current={tab.value === status ? "page" : undefined}
                className={cn(
                  "block border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors",
                  tab.value === status
                    ? "border-ink bg-ink text-ivory"
                    : "border-border text-foreground/80 hover:border-ink",
                )}
              >
                {tab.label} ({tab.count})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form
        action="/admin/orders"
        method="get"
        className="mt-6 flex flex-wrap items-end gap-4 border border-border p-4"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <div className="min-w-64 flex-1">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Order number, name, email, phone or city"
            className="mt-2"
          />
        </div>
        <Button type="submit">Search</Button>
        {q && (
          <Link
            href={hrefFor({ q: "", status }, 1)}
            className={buttonVariants({ variant: "ghost" })}
          >
            Clear
          </Link>
        )}
      </form>

      <div className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.orders.map((order) => {
              const payment = order.payments[0];
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="hover:underline"
                    >
                      {formatOrderNumber(order.number)}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <p>{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customerEmail}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">{order._count.items}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(order.total.toNumber())}
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderBadgeVariant(order.status)}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment ? (
                      <>
                        {payment.status === "PENDING" && payment.receiptSubmittedAt
                          ? "Receipt to check"
                          : PAYMENT_STATUS_LABEL[payment.status]}
                        <span className="block text-xs text-muted-foreground">
                          {paymentProviderLabel(payment.provider)}
                        </span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            {result.orders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  {q || status
                    ? "No orders match this search."
                    : "No orders yet. They will appear here when customers check out."}
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