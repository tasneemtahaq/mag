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

function NotOpen({
  text,
  reasons,
}: {
  text: string;
  // Only passed for admins
  reasons: string[] | null;
}) {
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

      {reasons && (
        <div className="mt-12 space-y-3 border border-dashed border-border p-5 text-sm">
          <p className="font-medium">Why is checkout closed? (only admins see this)</p>
          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <Link
            href="/admin/payments"
            className="inline-block underline underline-offset-4"
          >
            Go to the Payments page
          </Link>
        </div>
      )}
    </Container>
  );
}

export default async function CheckoutPage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "ADMIN";

  const open = await isCheckoutEnabled();
  const { methods } = await getEnabledPaymentMethods();

  if (!open || methods.length === 0) {
    const reasons = [
      open
        ? "Online ordering is switched on."
        : "Online ordering is switched OFF. Press \u201cOpen ordering\u201d on the Payments page.",
      methods.length > 0
        ? `Payment methods that are on: ${methods.map((method) => method.label).join(", ")}.`
        : "No payment method is switched on. Fill in an account's details on the Payments page and save.",
    ];

    return (
      <NotOpen
        text={
          open
            ? "Online ordering is almost ready. If you would like to enquire about an artwork, please contact the gallery."
            : "Online ordering isn't open yet. If you would like to enquire about an artwork, please contact the gallery."
        }
        reasons={isAdmin ? reasons : null}
      />
    );
  }

  const cart = await getCartView();
  // Nothing to buy, or something in the cart needs fixing first
  if (cart.lines.length === 0 || cart.hasIssues) redirect("/cart");

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