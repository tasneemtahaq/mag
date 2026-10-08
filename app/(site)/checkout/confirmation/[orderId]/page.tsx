import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CartSync } from "@/components/cart/cart-sync";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { formatOrderNumber, formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order received",
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
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order) notFound();

  // Private: this browser just placed the order, or it's the customer's own order,
  // or the viewer is an admin. Anyone else sees a plain 404.
  const session = await getSession();
  const placedHere =
    (await cookies()).get("mag_last_order")?.value === order.id;
  const allowed =
    placedHere ||
    (session &&
      (session.user.id === order.userId || session.user.role === "ADMIN"));
  if (!allowed) notFound();

  const firstName = order.customerName.split(" ")[0];

  return (
    <Container size="narrow" className="py-16 sm:py-24">
      <CartSync count={0} />
      <SectionHeading
        as="h1"
        eyebrow="Order received"
        title={`Thank you, ${firstName}`}
        description="We have your order. The gallery will contact you shortly to confirm it and arrange delivery."
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
            <dd className="mt-1">Cash on delivery</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Date
            </dt>
            <dd className="mt-1">
              {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
                order.createdAt,
              )}
            </dd>
          </div>
        </dl>

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
              <dt>Total to pay on delivery</dt>
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
      </div>
    </Container>
  );
}