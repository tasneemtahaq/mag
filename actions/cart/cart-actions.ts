"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { findCart } from "@/lib/cart/cart-session";
import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/cart/constants";
import { visibleWhere } from "@/lib/data/products";
import { db } from "@/lib/db/prisma";

export type AddToCartResult =
  | { ok: true; count: number }
  | { ok: false; message: string };

const addSchema = z.object({
  variantId: z.string().min(1).max(60),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});

async function countFor(cartId: string) {
  const total = await db.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  });
  return total._sum.quantity ?? 0;
}

// Called by the product page's Add to cart button
export async function addToCart(
  variantId: string,
  quantity: number,
): Promise<AddToCartResult> {
  const parsed = addSchema.safeParse({ variantId, quantity });
  if (!parsed.success) {
    return { ok: false, message: "Please choose a valid quantity." };
  }

  // The server checks the artwork itself: visible, available, in stock
  const variant = await db.productVariant.findFirst({
    where: {
      id: parsed.data.variantId,
      isActive: true,
      deletedAt: null,
      product: visibleWhere(),
    },
    select: { id: true, stock: true },
  });
  if (!variant) {
    return { ok: false, message: "Sorry, this artwork is no longer available." };
  }
  if (variant.stock <= 0) {
    return { ok: false, message: "Sorry, this artwork has sold." };
  }

  const cart = await findCart({ create: true, writable: true });
  if (!cart) {
    return { ok: false, message: "We couldn't open your cart. Please try again." };
  }

  const existing = await db.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    select: { quantity: true },
  });

  const allowed = Math.min(variant.stock, MAX_LINE_QUANTITY);
  const room = allowed - (existing?.quantity ?? 0);
  if (parsed.data.quantity > room) {
    return {
      ok: false,
      message:
        room <= 0
          ? "All the available pieces are already in your cart."
          : `You can add ${room} more of this option.`,
    };
  }

  if (!existing) {
    const lines = await db.cartItem.count({ where: { cartId: cart.id } });
    if (lines >= MAX_CART_LINES) {
      return { ok: false, message: "Your cart is full. Please check out first." };
    }
  }

  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    update: { quantity: { increment: parsed.data.quantity } },
    create: {
      cartId: cart.id,
      variantId: variant.id,
      quantity: parsed.data.quantity,
    },
  });
  // Marks the cart as recently used, so old abandoned ones can be cleaned up later
  await db.cart.update({ where: { id: cart.id }, data: {} });

  return { ok: true, count: await countFor(cart.id) };
}

const idFrom = (formData: FormData) => String(formData.get("id") ?? "");

// Every change below only touches lines that belong to the visitor's OWN cart

export async function updateCartItem(formData: FormData) {
  const cart = await findCart({ create: false, writable: true });
  if (!cart) return;

  const quantity = Number(formData.get("quantity"));
  if (!Number.isInteger(quantity) || quantity < 1) return;

  const item = await db.cartItem.findFirst({
    where: { id: idFrom(formData), cartId: cart.id },
    select: { id: true, variant: { select: { stock: true } } },
  });
  if (!item) return;

  const allowed = Math.min(item.variant.stock, MAX_LINE_QUANTITY);
  if (allowed < 1) return;

  await db.cartItem.update({
    where: { id: item.id },
    data: { quantity: Math.min(quantity, allowed) },
  });
  revalidatePath("/cart");
}

export async function removeCartItem(formData: FormData) {
  const cart = await findCart({ create: false, writable: true });
  if (!cart) return;

  await db.cartItem.deleteMany({
    where: { id: idFrom(formData), cartId: cart.id },
  });
  revalidatePath("/cart");
}

export async function clearCart() {
  const cart = await findCart({ create: false, writable: true });
  if (!cart) return;

  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/cart");
}