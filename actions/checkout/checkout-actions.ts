"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth/session";
import { findCart } from "@/lib/cart/cart-session";
import { isCheckoutEnabled } from "@/lib/checkout/enabled";
import { priceOrder } from "@/lib/checkout/pricing";
import type { PlaceOrderResult, QuoteResult } from "@/lib/checkout/types";
import { db } from "@/lib/db/prisma";
import { checkoutSchema, quoteSchema } from "@/lib/validation/checkout";

// An expected problem (sold out, bad code...) that we explain to the customer
class CheckoutError extends Error {}

const CLOSED = "Checkout isn't open yet. Please check back soon.";

// Reads the cart's items with everything we need, from the database itself
async function loadLines(client: Prisma.TransactionClient, cartId: string) {
  const items = await client.cartItem.findMany({
    where: { cartId },
    orderBy: { createdAt: "asc" },
    select: {
      quantity: true,
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          salePrice: true,
          stock: true,
          isActive: true,
          deletedAt: true,
          product: {
            select: {
              name: true,
              status: true,
              deletedAt: true,
              category: { select: { isActive: true, archivedAt: true } },
              images: {
                orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }],
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });

  return items.map((item) => {
    const { variant } = item;
    const { product } = variant;
    return {
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name,
      sku: variant.sku,
      imageUrl: product.images[0]?.url ?? null,
      unitPrice: variant.salePrice ?? variant.price,
      quantity: item.quantity,
      stock: variant.stock,
      // The same rule customers see in the shop
      available:
        variant.isActive &&
        variant.deletedAt === null &&
        product.status === "ACTIVE" &&
        product.deletedAt === null &&
        product.category.isActive &&
        product.category.archivedAt === null,
    };
  });
}

function fieldErrors(error: ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

// ---------- The live preview of delivery, discount and total ----------
export async function quoteCheckout(input: unknown): Promise<QuoteResult> {
  if (!isCheckoutEnabled()) return { ok: false, message: CLOSED };

  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "We couldn't read your details." };
  }

  const cart = await findCart({ create: false, writable: true });
  if (!cart) return { ok: false, message: "Your cart is empty." };

  const lines = await loadLines(db, cart.id);
  if (lines.length === 0) return { ok: false, message: "Your cart is empty." };
  if (lines.some((line) => !line.available || line.stock < line.quantity)) {
    return {
      ok: false,
      message: "Some items in your cart have changed. Please review your cart.",
    };
  }

  const priced = await priceOrder(db, {
    lines,
    province: parsed.data.province,
    city: parsed.data.city,
    discountCode: parsed.data.discountCode,
  });

  return {
    ok: true,
    discountError: priced.discountError,
    quote: {
      subtotal: priced.subtotal.toNumber(),
      shippingCost: priced.shippingCost?.toNumber() ?? null,
      shippingLabel: priced.shippingLabel,
      discountTotal: priced.discount?.amount.toNumber() ?? 0,
      discountCode: priced.discount?.code ?? null,
      total: priced.total.toNumber(),
    },
  };
}

// ---------- Turning the cart into an order ----------
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  if (!isCheckoutEnabled()) return { ok: false, message: CLOSED };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const session = await getSession();
  const cart = await findCart({ create: false, writable: true });
  if (!cart) return { ok: false, message: "Your cart is empty." };

  let orderId: string;
  try {
    // Everything below succeeds together, or none of it happens
    orderId = await db.$transaction(
      async (tx) => {
        const lines = await loadLines(tx, cart.id);
        if (lines.length === 0) throw new CheckoutError("Your cart is empty.");

        for (const line of lines) {
          if (!line.available) {
            throw new CheckoutError(
              `"${line.productName}" is no longer available. Please remove it from your cart.`,
            );
          }
        }

        // Take the stock. The guard ("stock is at least this many") means that
        // if two people buy the last piece at once, only one of them succeeds.
        for (const line of lines) {
          const taken = await tx.productVariant.updateMany({
            where: {
              id: line.variantId,
              isActive: true,
              deletedAt: null,
              stock: { gte: line.quantity },
            },
            data: { stock: { decrement: line.quantity } },
          });
          if (taken.count !== 1) {
            throw new CheckoutError(
              `Sorry, "${line.productName}" has just sold or doesn't have enough pieces left. Please review your cart.`,
            );
          }
        }

        // Prices, delivery and discount are all worked out here, from the database
        const priced = await priceOrder(tx, {
          lines,
          province: data.province,
          city: data.city,
          discountCode: data.discountCode,
        });
        if (priced.discountError) throw new CheckoutError(priced.discountError);
        if (priced.shippingCost === null) {
          throw new CheckoutError("Please choose your province.");
        }

        if (priced.discount) {
          // Count the use, but only if nobody else used the code since we looked
          const counted = await tx.discount.updateMany({
            where: {
              id: priced.discount.id,
              usedCount: priced.discount.seenUsedCount,
            },
            data: { usedCount: { increment: 1 } },
          });
          if (counted.count !== 1) {
            throw new CheckoutError(
              "That discount code was just used up. Please try placing your order again.",
            );
          }
        }

        const order = await tx.order.create({
          data: {
            userId: session?.user.id ?? null,
            customerName: data.name,
            customerEmail: data.email,
            customerPhone: data.phone,
            shipName: data.name,
            shipPhone: data.phone,
            shipLine1: data.line1,
            shipLine2: data.line2 || null,
            shipCity: data.city,
            shipProvince: data.province,
            shipPostalCode: data.postalCode || null,
            shipCountry: "PK",
            subtotal: priced.subtotal,
            shippingCost: priced.shippingCost,
            discountTotal: priced.discount?.amount ?? 0,
            total: priced.total,
            discountCode: priced.discount?.code ?? null,
            notes: data.notes || null,
            items: {
              create: lines.map((line) => ({
                variantId: line.variantId,
                productName: line.productName,
                variantName: line.variantName,
                sku: line.sku,
                imageUrl: line.imageUrl,
                unitPrice: line.unitPrice,
                quantity: line.quantity,
                lineTotal: line.unitPrice.mul(line.quantity),
              })),
            },
            // Cash on delivery: paid when the artwork arrives
            payments: {
              create: {
                provider: "cod",
                status: "PENDING",
                amount: priced.total,
              },
            },
          },
          select: { id: true },
        });

        if (priced.discount) {
          await tx.discountUsage.create({
            data: {
              discountId: priced.discount.id,
              orderId: order.id,
              userId: session?.user.id ?? null,
              amount: priced.discount.amount,
            },
          });
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        // A signed-in customer can keep this address for next time
        if (session && data.saveAddress) {
          const already = await tx.address.findFirst({
            where: {
              userId: session.user.id,
              line1: data.line1,
              city: data.city,
            },
            select: { id: true },
          });
          if (!already) {
            const count = await tx.address.count({
              where: { userId: session.user.id },
            });
            await tx.address.create({
              data: {
                userId: session.user.id,
                fullName: data.name,
                phone: data.phone,
                line1: data.line1,
                line2: data.line2 || null,
                city: data.city,
                province: data.province,
                postalCode: data.postalCode || null,
                country: "PK",
                isDefault: count === 0,
              },
            });
          }
        }

        return order.id;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { ok: false, message: error.message };
    }
    console.error("Placing the order failed", error);
    return {
      ok: false,
      message: "We couldn't place your order. Please try again.",
    };
  }

  // Lets this browser (and only this browser) view the confirmation page
  (await cookies()).set("mag_last_order", orderId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/checkout",
    maxAge: 60 * 60 * 2,
  });

  // Stock changed, so product pages and the shop must be rebuilt
  revalidatePath("/", "layout");
  redirect(`/checkout/confirmation/${orderId}`);
}