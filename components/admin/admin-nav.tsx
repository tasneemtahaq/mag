import Link from "next/link";
import {
  ExternalLink,
  Frame,
  Layers,
  LayoutDashboard,
  Ruler,
  Tags,
} from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/subcategories", label: "Subcategories", icon: Layers },
  { href: "/admin/products", label: "Products", icon: Frame },
  { href: "/admin/sizes", label: "Sizes", icon: Ruler },
] as const;

const linkClass =
  "flex items-center gap-2 whitespace-nowrap px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground";

export function AdminNav() {
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={linkClass}>
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
      <Link href="/" className={linkClass}>
        <ExternalLink className="size-4" />
        View site
      </Link>
    </nav>
  );
}