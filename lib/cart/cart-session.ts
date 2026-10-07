import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { MAX_LINE_QUANTITY } from "@/lib/cart/constants";
import { db } from "@/lib/db/prisma";

const COOKIE_NAME = "mag_cart";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// The database keeps only a fingerprint of the cookie's secret value
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

// A guest signed in: their guest cart joins their account cart
async function mergeGuestCart(
  guestCartId: string,
  userId: string,
  userCartId: string | null,
) {
  try {
    if (!userCartId) {
      // No account cart yet: the guest cart simply becomes theirs
      return await db.cart.update({
        where: { id: guestCartId },
        data: { userId, guestToken: null },
        select: { id: true },
      });
    }

    const guestItems = await db.cartItem.findMany({
      where: { cartId: guestCartId },
      select: { variantId: true, quantity: true },
    });

    await db.$transaction([
      ...guestItems.map((item) =>
        db.cartItem.upsert({
          where: {
            cartId_variantId: { cartId: userCartId, variantId: item.variantId },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            cartId: userCartId,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        }),
      ),
      db.cartItem.updateMany({
        where: { cartId: userCartId, quantity: { gt: MAX_LINE_QUANTITY } },
        data: { quantity: MAX_LINE_QUANTITY },
      }),
      db.cart.delete({ where: { id: guestCartId } }),
    ]);
    return { id: userCartId };
  } catch {
    // Two requests merged at the same moment: the other one won
    return db.cart.findUnique({ where: { userId }, select: { id: true } });
  }
}

// create:   make a cart if there isn't one yet
// writable: this code runs where cookies may be changed (a Server Action or a
//           Route Handler). Plain page rendering cannot set or delete cookies.
export async function findCart({
  create,
  writable,
}: {
  create: boolean;
  writable: boolean;
}) {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const session = await getSession();

  // ----- A signed-in customer -----
  if (session) {
    const userId = session.user.id;
    let cart = await db.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (token) {
      const guestCart = await db.cart.findUnique({
        where: { guestToken: hashToken(token) },
        select: { id: true },
      });
      if (guestCart) {
        cart = await mergeGuestCart(guestCart.id, userId, cart?.id ?? null);
      }
      // The guest cookie is no longer needed
      if (writable) jar.delete(COOKIE_NAME);
    }

    if (!cart && create) {
      cart = await db.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true },
      });
    }
    return cart;
  }

  // ----- A guest -----
  if (token) {
    const cart = await db.cart.findUnique({
      where: { guestToken: hashToken(token) },
      select: { id: true },
    });
    if (cart) return cart;
  }

  if (!create || !writable) return null;

  const newToken = randomBytes(32).toString("base64url");
  const cart = await db.cart.create({
    data: { guestToken: hashToken(newToken) },
    select: { id: true },
  });
  jar.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  return cart;
}