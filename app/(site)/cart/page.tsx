import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  clearCart,
  removeCartItem,
  updateCartItem,
} from "@/actions/cart/cart-actions";
import { CartSync } from "@/components/cart/cart-sync";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCartView } from "@/lib/data/cart";
import type { CartLine } from "@/lib/data/cart";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

const selectClass =
  "h-9 border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function issueText(line: CartLine) {
  switch (line.issue) {
    case "unavailable":
      return "This artwork is no longer available. Please remove it.";
    case "soldout":
      return "This option has just sold out. Please remove it.";
    case "limited":
      return `Only ${line.maxQuantity} available. Update the quantity to continue.`;
    default:
      return null;
  }
}

export default async function CartPage() {
  const cart = await getCartView();

  if (cart.lines.length === 0) {
    return (
      <Container size="narrow" className="py-20 sm:py-28">
        <CartSync count={0} />
        <SectionHeading
          as="h1"
          eyebrow="Cart"
          title="Your cart is empty"
          description="When you find artwork you love, it will wait for you here."
        />
        <Link href="/shop" className={buttonVariants({ size: "lg", className: "mt-10" })}>
          Browse the shop
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-16 sm:py-24">
      <CartSync count={cart.itemCount} />
      <SectionHeading as="h1" eyebrow="Cart" title="Your cart" />

      <div className="mt-12 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-border border-y border-border">
            {cart.lines.map((line) => {
              const problem = issueText(line);
              return (
                <li key={line.id} className="flex gap-5 py-6">
                  <Link
                    href={`/products/${line.productSlug}`}
                    className="relative block size-24 shrink-0 bg-linen sm:size-28"
                  >
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt={line.imageAlt ?? line.productName}
                        fill
                        sizes="112px"
                        className="object-contain p-1"
                      />
                    ) : null}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
                      <div>
                        <Link
                          href={`/products/${line.productSlug}`}
                          className="font-display text-xl font-light hover:underline"
                        >
                          {line.productName}
                        </Link>
                        {line.variantName !== "Standard" && (
                          <p className="text-sm text-muted-foreground">
                            {line.variantName}
                          </p>
                        )}
                      </div>
                      <p className="text-sm">
                        <span className={line.originalPrice ? "text-gold-deep" : undefined}>
                          {formatPrice(line.unitPrice)}
                        </span>
                        {line.originalPrice && (
                          <span className="ml-2 text-muted-foreground line-through">
                            {formatPrice(line.originalPrice)}
                          </span>
                        )}
                      </p>
                    </div>

                    {problem && (
                      <p role="alert" className="mt-3 text-sm text-destructive">
                        {problem}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                      {line.maxQuantity > 0 && (
                        <form
                          action={updateCartItem}
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="id" value={line.id} />
                          <label htmlFor={`quantity-${line.id}`} className="sr-only">
                            Quantity for {line.productName}
                          </label>
                          <select
                            id={`quantity-${line.id}`}
                            name="quantity"
                            defaultValue={line.payableQuantity || 1}
                            className={selectClass}
                          >
                            {Array.from(
                              { length: line.maxQuantity },
                              (_, index) => index + 1,
                            ).map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="outline">
                            Update
                          </Button>
                        </form>
                      )}

                      <form action={removeCartItem}>
                        <input type="hidden" name="id" value={line.id} />
                        <button
                          type="submit"
                          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                          Remove
                        </button>
                      </form>

                      <p className="ml-auto text-sm font-medium">
                        {formatPrice(line.lineTotal)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <form action={clearCart} className="mt-6">
            <button
              type="submit"
              className="text-xs uppercase tracking-[0.15em] text-muted-foreground underline underline-offset-8 hover:text-foreground"
            >
              Clear cart
            </button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-border p-6">
            <h2 className="font-display text-2xl font-light">Summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Delivery cost and any discount code are added at checkout, once
              you have entered your delivery address.
            </p>

            {cart.hasIssues && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                Some items need your attention before you can check out.
              </p>
            )}

            <div className="mt-6 space-y-3">
              <Button size="lg" className="w-full" disabled>
                Checkout
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Checkout opens soon.
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            <Link href="/shop" className="underline underline-offset-4">
              Continue shopping
            </Link>
          </p>
        </aside>
      </div>
    </Container>
  );
}