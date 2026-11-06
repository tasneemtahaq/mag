import "server-only";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";

const COOKIE = "mag_orders";
const MAX_REMEMBERED = 5;
const TWO_WEEKS = 60 * 60 * 24 * 14;

// Called when an order is placed (in a Server Action). Keeps the last few order ids
// in a private cookie, so this browser can open its own orders.
export async function rememberOrder(orderId: string) {
  const jar = await cookies();
  const current = (jar.get(COOKIE)?.value ?? "").split(",").filter(Boolean);
  const next = [orderId, ...current.filter((id) => id !== orderId)].slice(
    0,
    MAX_REMEMBERED,
  );
  jar.set(COOKIE, next.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWO_WEEKS,
  });
}

// An order may be opened by: the browser that placed it, the customer it belongs
// to, or an admin. Everybody else gets nothing.
export async function canAccessOrder(order: { id: string; userId: string | null }) {
  const jar = await cookies();
  const remembered = (jar.get(COOKIE)?.value ?? "").split(",");
  if (remembered.includes(order.id)) return true;

  const session = await getSession();
  return Boolean(
    session &&
      (session.user.id === order.userId || session.user.role === "ADMIN"),
  );
}