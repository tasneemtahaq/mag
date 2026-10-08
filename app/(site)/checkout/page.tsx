import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { isCheckoutEnabled } from "@/lib/checkout/enabled";
import { getCartView } from "@/lib/data/cart";
import { db } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  if (!isCheckoutEnabled()) {
    return (
      <Container size="narrow" className="py-20 sm:py-28">
        <SectionHeading
          as="h1"
          eyebrow="Checkout"
          title="Checkout opens soon"
          description="Online ordering isn't open yet. If you would like to enquire about an artwork, please contact the gallery."
        />
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/contact" className={buttonVariants({ size: "lg" })}>
            Contact the gallery
          </Link>
          <Link
            href="/shop"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Continue browsing
          </Link>
        </div>
      </Container>
    );
  }

  const cart = await getCartView();
  // Nothing to buy, or something in the cart needs fixing first
  if (cart.lines.length === 0 || cart.hasIssues) redirect("/cart");

  const session = await getSession();
  const addresses = session
    ? await db.address.findMany({
        where: { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        take: 10,
        select: {
          id: true,
          fullName: true,
          phone: true,
          line1: true,
          line2: true,
          city: true,
          province: true,
          postalCode: true,
        },
      })
    : [];

  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading as="h1" eyebrow="Checkout" title="Complete your order" />
      <div className="mt-12">
        <CheckoutForm
          lines={cart.lines.map((line) => ({
            id: line.id,
            name: line.productName,
            variantName: line.variantName,
            imageUrl: line.imageUrl,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          }))}
          subtotal={cart.subtotal}
          signedIn={Boolean(session)}
          initial={{
            name: session?.user.name ?? "",
            email: session?.user.email ?? "",
          }}
          addresses={addresses}
        />
      </div>
    </Container>
  );
}