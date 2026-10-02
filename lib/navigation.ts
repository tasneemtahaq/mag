export const mainNav = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

// Shown as icons on desktop, and inside the mobile menu.
export const utilityNav = [
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Account", href: "/account" },
] as const;

export const footerNav = {
  gallery: [
    { label: "About", href: "/about" },
    { label: "Collections", href: "/collections" },
    { label: "Contact", href: "/contact" },
  ],
  customer: [
    { label: "Account", href: "/account" },
    { label: "Orders", href: "/account/orders" },
    { label: "Wishlist", href: "/account/wishlist" },
    { label: "Shipping", href: "/shipping-policy" },
    { label: "Returns", href: "/refund-policy" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Refunds", href: "/refund-policy" },
    { label: "Shipping", href: "/shipping-policy" },
  ],
} as const;