import Link from "next/link";
import { getActiveCategories } from "@/lib/data/categories";
import { cn } from "@/lib/utils";

export async function CategoryChips({ currentSlug }: { currentSlug?: string }) {
  const categories = await getActiveCategories();

  const items = [
    { label: "All", href: "/shop", active: !currentSlug },
    ...categories.map((category) => ({
      label: category.name,
      href: `/shop/${category.slug}`,
      active: category.slug === currentSlug,
    })),
  ];

  return (
    <nav aria-label="Categories">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "block border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors",
                item.active
                  ? "border-ink bg-ink text-ivory"
                  : "border-border text-foreground/80 hover:border-ink hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}