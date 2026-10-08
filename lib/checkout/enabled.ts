// Checkout only works where CHECKOUT_ENABLED="true" is set.
// Keep it off on the live site until there is an admin screen for orders.
export function isCheckoutEnabled() {
  return process.env.CHECKOUT_ENABLED === "true";
}