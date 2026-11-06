import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  advanceOrder,
  cancelOrder,
  markPaid,
  refundOrder,
  rejectReceipt,
  saveShipping,
} from "@/actions/orders/order-actions";
import { signedReceiptUrl } from "@/lib/storage/cloudinary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminOrder } from "@/lib/data/admin-orders";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  SHIPPING_STATUS_LABEL,
  orderBadgeVariant,
  paymentProviderLabel,
} from "@/lib/order-labels";
import {
  canCancel,
  canRefund,
  nextForwardStatuses,
} from "@/lib/orders/workflow";

export const metadata: Metadata = { title: "Order" };

const notices: Record<string, string> = {
  "status-updated": "Order status updated.",
  "shipping-saved": "Shipping details saved.",
  "marked-paid": "Payment approved. The order is confirmed.",
  "receipt-rejected": "Receipt rejected. The customer can upload another.",
  cancelled: "Order cancelled. The items were returned to stock.",
  refunded: "Order marked as refunded.",
};

const problems: Record<string, string> = {
    "not-paid":
    "Payment must be approved before an order can be shipped or delivered.",
  "note-needed": "Please write a short reason (3 to 200 characters) for the customer.",
  "not-allowed": "That change isn't possible for this order's current status.",
  changed:
    "Someone changed this order a moment ago. The page now shows its latest state.",
  "too-long": "That text is too long. Please shorten it.",
  confirm: "Please tick the box to confirm.",
};

const selectClass =
  "mt-2 flex h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function AdminOrderPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { notice, error } = await searchParams;

  const order = await getAdminOrder(id);
  if (!order) notFound();

  const forward = nextForwardStatuses(order.status);
  const open = order.status !== "CANCELLED" && order.status !== "REFUNDED";
  const hasUnpaid = order.payments.some((payment) => payment.status === "PENDING");
  const hasPaid = order.payments.some((payment) => payment.status === "PAID");
  const hasReceipts = order.payments.some((payment) => payment.receipts.length > 0);
  const hasSubmittedReceipt = order.payments.some(
    (payment) => payment.status === "PENDING" && payment.receiptSubmittedAt !== null,
  );

  return (
    <div className="max-w-6xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Link href="/admin/orders" className="hover:text-foreground">
          Orders
        </Link>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl font-light">
          {formatOrderNumber(order.number)}
        </h1>
        <Badge variant={orderBadgeVariant(order.status)}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Placed {formatDateTime(order.createdAt)} · Delivery:{" "}
        {SHIPPING_STATUS_LABEL[order.shippingStatus]}
      </p>

      {notice && notices[notice] && (
        <p role="status" className="mt-6 border border-border bg-muted px-4 py-3 text-sm">
          {notices[notice]}
        </p>
      )}
      {error && problems[error] && (
        <p
          role="alert"
          className="mt-6 border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {problems[error]}
        </p>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-5">
        {/* ----- Left: what was ordered ----- */}
        <div className="space-y-10 lg:col-span-3">
          <section aria-labelledby="items-heading">
            <h2 id="items-heading" className="mb-4 font-display text-2xl font-light">
              Items
            </h2>
            <ul className="divide-y divide-border border-y border-border">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <div className="relative size-16 shrink-0 bg-linen">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-contain p-0.5"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{item.productName}</p>
                    {item.variantName !== "Standard" && (
                      <p className="text-muted-foreground">{item.variantName}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      SKU {item.sku} · {formatPrice(item.unitPrice.toNumber())} each ·
                      Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm">{formatPrice(item.lineTotal.toNumber())}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(order.subtotal.toNumber())}</dd>
              </div>
              {order.discountTotal.toNumber() > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Discount{order.discountCode ? ` (${order.discountCode})` : ""}
                  </dt>
                  <dd className="text-gold-deep">
                    −{formatPrice(order.discountTotal.toNumber())}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>
                  {order.shippingCost.toNumber() === 0
                    ? "Free"
                    : formatPrice(order.shippingCost.toNumber())}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-4 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(order.total.toNumber())}</dd>
              </div>
            </dl>
          </section>

          {order.notes && (
            <section aria-labelledby="note-heading">
              <h2 id="note-heading" className="mb-3 font-display text-2xl font-light">
                Note from the customer
              </h2>
              <p className="whitespace-pre-line border border-border p-4 text-sm">
                {order.notes}
              </p>
            </section>
          )}

          <section aria-labelledby="customer-heading" className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2
                id="customer-heading"
                className="mb-3 font-display text-2xl font-light"
              >
                Customer
              </h2>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.customerName}</p>
                <p>
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="underline underline-offset-4"
                  >
                    {order.customerEmail}
                  </a>
                </p>
                <p>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="underline underline-offset-4"
                  >
                    {order.customerPhone}
                  </a>
                </p>
                <p className="pt-2 text-xs text-muted-foreground">
                  {order.user ? "Registered customer" : "Guest checkout"}
                </p>
              </div>
            </div>
            <div>
              <h2 className="mb-3 font-display text-2xl font-light">
                Delivery address
              </h2>
              <address className="space-y-1 text-sm not-italic">
                <p className="font-medium">{order.shipName}</p>
                <p>{order.shipLine1}</p>
                {order.shipLine2 && <p>{order.shipLine2}</p>}
                <p>
                  {order.shipCity}
                  {order.shipPostalCode ? ` ${order.shipPostalCode}` : ""},{" "}
                  {order.shipProvince}
                </p>
                <p>Pakistan</p>
                <p className="pt-1 text-muted-foreground">{order.shipPhone}</p>
              </address>
            </div>
          </section>
        </div>

        {/* ----- Right: what you can do ----- */}
        <div className="space-y-10 lg:col-span-2">
          {forward.length > 0 && (
            <section aria-labelledby="status-heading">
              <h2 id="status-heading" className="mb-3 font-display text-2xl font-light">
                Move the order forward
              </h2>
              <form action={advanceOrder} className="space-y-3 border border-border p-4">
                <input type="hidden" name="id" value={order.id} />
                <Label htmlFor="status">New status</Label>
                <select id="status" name="status" className={selectClass}>
                  {forward.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                    Shipped and Delivered need an approved payment.
                </p>
                <Button type="submit">Update status</Button>
              </form>
            </section>
          )}

          <section aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="mb-3 font-display text-2xl font-light">
              Courier and tracking
            </h2>
            <form action={saveShipping} className="space-y-4 border border-border p-4">
              <input type="hidden" name="id" value={order.id} />
              <div>
                <Label htmlFor="carrier">Courier</Label>
                <Input
                  id="carrier"
                  name="carrier"
                  defaultValue={order.carrier ?? ""}
                  placeholder="For example TCS or Leopards"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="trackingNumber">Tracking number</Label>
                <Input
                  id="trackingNumber"
                  name="trackingNumber"
                  defaultValue={order.trackingNumber ?? ""}
                  className="mt-2"
                />
              </div>
              <Button type="submit" variant="outline">
                Save
              </Button>
            </form>
          </section>

                    <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="mb-3 font-display text-2xl font-light">
              Payment
            </h2>
            <ul className="space-y-6 border border-border p-4 text-sm">
              {order.payments.map((payment) => (
                <li key={payment.id} className="space-y-3">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {paymentProviderLabel(payment.provider)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paidAt
                          ? `Approved ${formatDateTime(payment.paidAt)}`
                          : payment.receiptSubmittedAt
                            ? `Receipt received ${formatDateTime(payment.receiptSubmittedAt)}`
                            : "Waiting for the customer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>
                        {payment.status === "PENDING" && payment.receiptSubmittedAt
                          ? "Receipt to check"
                          : PAYMENT_STATUS_LABEL[payment.status]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(payment.amount.toNumber())}
                      </p>
                    </div>
                  </div>

                  {payment.payerReference && (
                    <p className="text-xs">
                      <span className="text-muted-foreground">
                        Customer&rsquo;s transaction ID:{" "}
                      </span>
                      {payment.payerReference}
                    </p>
                  )}

                  {payment.rejectionNote && payment.status === "PENDING" && (
                    <p className="text-xs text-destructive">
                      Rejected: {payment.rejectionNote}
                    </p>
                  )}

                  {payment.receipts.length > 0 && (
                    <ul className="flex flex-wrap gap-4">
                      {payment.receipts.map((receipt, index) => (
                        <li key={receipt.id}>
                          <a
                            href={signedReceiptUrl(receipt.publicId, receipt.format)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {/* A private, signed link, so the plain image tag is used on purpose */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={signedReceiptUrl(receipt.publicId, receipt.format, 400)}
                              alt={`Receipt ${index + 1}`}
                              className="max-h-48 w-auto border border-border"
                            />
                            <span className="mt-1 block text-xs underline underline-offset-4">
                              Open full size
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {order.payments.length === 0 && (
                <li className="text-muted-foreground">No payment record.</li>
              )}
            </ul>

            {open && hasUnpaid && (
              <div className="mt-4 space-y-5">
                <form action={markPaid} className="space-y-2">
                  <input type="hidden" name="id" value={order.id} />
                  <Button type="submit">
                    {hasReceipts ? "Approve payment" : "Mark payment as paid"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Approving confirms the order. Check the receipt against your
                    own account first.
                  </p>
                </form>

                {hasSubmittedReceipt && (
                  <form action={rejectReceipt} className="space-y-2">
                    <input type="hidden" name="id" value={order.id} />
                    <Label htmlFor="note">Reason shown to the customer</Label>
                    <Input
                      id="note"
                      name="note"
                      placeholder="For example: the amount doesn't match"
                      maxLength={200}
                      required
                      className="mt-2"
                    />
                    <Button type="submit" variant="outline">
                      Reject receipt
                    </Button>
                  </form>
                )}
              </div>
            )}
          </section>

          {(canCancel(order.status) || canRefund(order.status)) && (
            <section
              aria-labelledby="danger-heading"
              className="space-y-6 border-t border-border pt-8"
            >
              <h2 id="danger-heading" className="font-display text-2xl font-light">
                Cancel or refund
              </h2>

              {canCancel(order.status) && (
                <form action={cancelOrder} className="space-y-3">
                  <input type="hidden" name="id" value={order.id} />
                  <p className="text-sm text-muted-foreground">
                    Cancelling puts the artwork back in stock and gives the
                    discount code its use back.
                    {hasPaid &&
                      " This order was paid. Money is not sent back automatically, so refund the customer yourself."}
                  </p>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="confirm"
                      required
                      className="mt-0.5 size-4 accent-destructive"
                    />
                    <span>Yes, cancel this order.</span>
                  </label>
                  <Button type="submit" variant="destructive">
                    Cancel order
                  </Button>
                </form>
              )}

              {canRefund(order.status) && (
                <form action={refundOrder} className="space-y-3">
                  <input type="hidden" name="id" value={order.id} />
                  <p className="text-sm text-muted-foreground">
                    This records a refund. It does not send any money, so give
                    the customer their money back yourself first.
                  </p>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="restock"
                      className="mt-0.5 size-4 accent-gold-deep"
                    />
                    <span>The artwork came back. Return it to stock.</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      name="confirm"
                      required
                      className="mt-0.5 size-4 accent-destructive"
                    />
                    <span>Yes, mark this order as refunded.</span>
                  </label>
                  <Button type="submit" variant="destructive">
                    Mark as refunded
                  </Button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}