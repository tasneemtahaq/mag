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
import { getEnabledPaymentMethods } from "@/lib/data/payments";
import { db } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

function NotOpen({ text, hint }: { text: string; hint: string }) {
  return (
    <Container size="narrow" className="py-20 sm:py-28">
      <SectionHeading
        as="h1"
        eyebrow="Checkout"
        title="Checkout opens soon"
        description={text}
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
      {/* Only you see this, and only while developing on your own computer */}
      {process.env.NODE_ENV === "development" && (
        <p className="mt-10 border border-dashed border-border p-4 text-xs text-muted-foreground">
          Developer note: {hint}
        </p>
      )}
    </Container>
  );
}

export default async function CheckoutPage() {
  if (!isCheckoutEnabled()) {
    return (
      <NotOpen
        text="Online ordering isn't open yet. If you would like to enquire about an artwork, please contact the gallery."
        hint='The safety switch is off. Add CHECKOUT_ENABLED="true" to .env.local and restart the dev server (on the live site, add it in Vercel and redeploy).'
      />
    );
  }

  const { methods } = await getEnabledPaymentMethods();
  if (methods.length === 0) {
    return (
      <NotOpen
        text="Online ordering is almost ready. If you would like to enquire about an artwork, please contact the gallery."
        hint="No payment method is switched on. Fill in an account's details at /admin/payments and save."
      />
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
          methods={methods.map(({ method, label }) => ({ method, label }))}
        />
      </div>
    </Container>
  );
}