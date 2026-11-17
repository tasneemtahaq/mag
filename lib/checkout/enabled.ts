import "server-only";
import { db } from "@/lib/db/prisma";

// Online ordering is opened and closed from the admin (Payments page).
// The default is closed, so a fresh site can never take orders by accident.
export async function isCheckoutEnabled() {
  const settings = await db.siteSettings.findUnique({
    where: { id: "site" },
    select: { checkoutOpen: true },
  });
  return settings?.checkoutOpen === true;
}