import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { findCart } from "@/lib/cart/cart-session";
import { MAX_LINE_QUANTITY } from "@/lib/cart/constants";
import { db } from "@/lib/db/prisma";
import { visibleWhere } from "@/lib/data/products";

export type CartLine = {
  id: string;
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  imageUrl: string | null;
  imageAlt: string | null;
  unitPrice: number;
  // The original price, when this option is on sale
  originalPrice: number | null;
  quantity: number;
  // How many can really be bought right now
  payableQuantity: number;
  maxQuantity: number;
  lineTotal: number;
  issue: "unavailable" | "soldout" | "limited" | null;
};

export type CartView = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  hasIssues: boolean;
};

// How many items are in the cart (for the navbar badge)
export async function getCartCount(writable = false) {
  const cart = await findCart({ create: false, writable });
  if (!cart) return 0;

  const total = await db.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { quantity: true },
  });
  return total._sum.quantity ?? 0;
}

// Everything the cart page shows. Prices are read fresh, never stored.
export async function getCartView(): Promise<CartView> {
  const cart = await findCart({ create: false, writable: false });
  if (!cart) return { lines: [], itemCount: 0, subtotal: 0, hasIssues: false };

  const items = await db.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
          salePrice: true,
          stock: true,
          isActive: true,
          deletedAt: true,
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              images: {
                orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }],
                take: 1,
                select: { url: true, alt: true },
              },
            },
          },
        },
      },
    },
  });

  // Which of these products can customers still see? (the same rule as the shop)
  const visible = await db.product.findMany({
    where: {
      ...visibleWhere(),
      id: { in: items.map((item) => item.variant.product.id) },
    },
    select: { id: true },
  });
  const visibleIds = new Set(visible.map((product) => product.id));

  let subtotal = new Prisma.Decimal(0);

  const lines = items.map((item): CartLine => {
    const { variant } = item;
    const { product } = variant;

    const purchasable =
      variant.isActive && variant.deletedAt === null && visibleIds.has(product.id);
    const maxQuantity = purchasable
      ? Math.max(0, Math.min(variant.stock, MAX_LINE_QUANTITY))
      : 0;
    const payableQuantity = Math.min(item.quantity, maxQuantity);

    const unit = variant.salePrice ?? variant.price;
    const lineTotal = unit.mul(payableQuantity);
    subtotal = subtotal.plus(lineTotal);

    const issue: CartLine["issue"] = !purchasable
      ? "unavailable"
      : variant.stock <= 0
        ? "soldout"
        : payableQuantity < item.quantity
          ? "limited"
          : null;

    const image = product.images[0];
    return {
      id: item.id,
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: variant.name,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt ?? null,
      unitPrice: unit.toNumber(),
      originalPrice: variant.salePrice ? variant.price.toNumber() : null,
      quantity: item.quantity,
      payableQuantity,
      maxQuantity,
      lineTotal: lineTotal.toNumber(),
      issue,
    };
  });

  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: subtotal.toNumber(),
    hasIssues: lines.some((line) => line.issue !== null),
  };
}