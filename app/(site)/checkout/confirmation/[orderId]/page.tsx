import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartSync } from "@/components/cart/cart-sync";
import { ReceiptUploader } from "@/components/checkout/receipt-uploader";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { getEnabledPaymentMethods } from "@/lib/data/payments";
import { db } from "@/lib/db/prisma";
import { formatDateTime, formatOrderNumber, formatPrice } from "@/lib/format";
import { PAYMENT_STATUS_LABEL, paymentProviderLabel } from "@/lib/order-labels";
import { canAccessOrder } from "@/lib/orders/access";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { id: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Private: this browser placed the order, or it's the customer's own order,
  // or the viewer is an admin. Anyone else sees a plain 404.
  if (!order || !(await canAccessOrder(order))) notFound();

  const payment = order.payments[0];
  const closed = order.status === "CANCELLED" || order.status === "REFUNDED";
  const paid = payment?.status === "PAID";
  const pending = !closed && !paid && payment?.status === "PENDING";
  const receiptSent = pending && Boolean(payment?.receiptSubmittedAt);

  const { methods, note } = await getEnabledPaymentMethods();
  const instructions = payment
    ? methods.find((method) => method.method === payment.provider)
    : undefined;

  const firstName = order.customerName.split(" ")[0];
  const description = closed
    ? "This order has been cancelled. If you think this is a mistake, please contact the gallery."
    : paid
      ? "We have received your payment. The gallery will contact you to arrange delivery."
      : receiptSent
        ? "We have your receipt and will check it shortly. We will contact you once your payment is confirmed."
        : "Your order is reserved. To complete it, send your payment and upload a photo or screenshot of the receipt below. Unpaid orders may be cancelled, and the artwork released.";

  return (
    <Container size="narrow" className="py-16 sm:py-24">
      <CartSync count={0} />
      <SectionHeading
        as="h1"
        eyebrow={closed ? "Order cancelled" : paid ? "Payment received" : "Order received"}
        title={`Thank you, ${firstName}`}
        description={description}
      />

      <div className="mt-12 space-y-10">
        <dl className="grid gap-6 border-y border-border py-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Order number
            </dt>
            <dd className="mt-1 text-lg font-medium">
              {formatOrderNumber(order.number)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Payment
            </dt>
            <dd className="mt-1">
              {payment ? paymentProviderLabel(payment.provider) : "—"}
              {payment && (
                <span className="block text-sm text-muted-foreground">
                  {receiptSent ? "Receipt received" : PAYMENT_STATUS_LABEL[payment.status]}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Date
            </dt>
            <dd className="mt-1">{formatDateTime(order.createdAt)}</dd>
          </div>
        </dl>

        {pending && payment && (
          <section
            aria-labelledby="pay-heading"
            className="space-y-6 border border-ink p-6"
          >
            <h2 id="pay-heading" className="font-display text-2xl font-light">
              {receiptSent ? "Your payment" : "How to pay"}
            </h2>

            <p className="text-sm">
              Send{" "}
              <span className="font-medium">
                {formatPrice(order.total.toNumber())}
              </span>{" "}
              by {paymentProviderLabel(payment.provider)} to:
            </p>

            {instructions ? (
              <dl className="divide-y divide-border border-y border-border text-sm">
                {instructions.rows.map((row) => (
                  <div key={row.label} className="grid grid-cols-3 gap-4 py-3">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="col-span-2 break-words font-medium">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please contact the gallery for the payment details.
              </p>
            )}

            <p className="text-sm text-muted-foreground">
              If you can, write{" "}
              <span className="font-medium text-foreground">
                {formatOrderNumber(order.number)}
              </span>{" "}
              in the payment note, so we can match your payment to your order.
            </p>
            {note && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {note}
              </p>
            )}

            {payment.rejectionNote && !receiptSent && (
              <p
                role="alert"
                className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                We couldn&rsquo;t accept your last receipt: {payment.rejectionNote}.
                Please upload a new one.
              </p>
            )}

            {receiptSent ? (
              <details>
                <summary className="cursor-pointer text-sm underline underline-offset-4">
                  Upload another receipt
                </summary>
                <div className="mt-4">
                  <ReceiptUploader
                    orderId={order.id}
                    initialReference={payment.payerReference ?? ""}
                  />
                </div>
              </details>
            ) : (
              <ReceiptUploader
                orderId={order.id}
                initialReference={payment.payerReference ?? ""}
              />
            )}
          </section>
        )}

        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className="mb-4 font-display text-2xl font-light">
            Your items
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-4 text-sm">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {item.variantName !== "Standard" && (
                    <p className="text-muted-foreground">{item.variantName}</p>
                  )}
                  <p className="text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <p>{formatPrice(item.lineTotal.toNumber())}</p>
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

        <section aria-labelledby="address-heading">
          <h2 id="address-heading" className="mb-4 font-display text-2xl font-light">
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
            <p className="pt-2 text-muted-foreground">{order.shipPhone}</p>
          </address>
        </section>

        <div className="flex flex-wrap gap-4 border-t border-border pt-8">
          <Link href="/shop" className={buttonVariants({ size: "lg" })}>
            Continue shopping
          </Link>
          <Link
            href="/contact"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Contact the gallery
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Keep your order number. This page stays available in this browser for
          14 days, and always in your account if you checked out while signed in.
        </p>
      </div>
    </Container>
  );
}