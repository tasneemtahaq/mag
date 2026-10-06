import Link from "next/link";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { Container } from "@/components/layout/container";
import { MobileNav } from "@/components/layout/mobile-nav";
import { buttonVariants } from "@/components/ui/button";
import { mainNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const iconLink = buttonVariants({ variant: "ghost", size: "icon" });

const navLink =
  "relative text-xs uppercase tracking-[0.2em] text-foreground/80 transition-colors hover:text-foreground " +
  "after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:scale-x-0 " +
  "after:bg-gold-deep after:transition-transform hover:after:scale-x-100";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <Container size="wide" className="flex h-16 items-center lg:h-20">
        {/* Mobile only: menu button on the left */}
        <div className="flex flex-1 items-center lg:hidden">
          <MobileNav />
        </div>

        {/* Logo: centered on mobile, left on desktop */}
        <div className="flex shrink-0 lg:flex-1">
          <Link
            href="/"
            aria-label="Muhammadi Art Gallery, home"
            className="font-display text-lg uppercase tracking-[0.25em] sm:text-xl"
          >
            Muhammadi
            <span className="hidden sm:inline"> Art Gallery</span>
          </Link>
        </div>

        {/* Desktop only: main links */}
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} className={navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Icons: search and cart always; wishlist and account on desktop */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <Link href="/search" aria-label="Search" className={iconLink}>
            <Search className="size-5" />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className={cn(iconLink, "hidden lg:inline-flex")}
          >
            <Heart className="size-5" />
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className={cn(iconLink, "hidden lg:inline-flex")}
          >
            <User className="size-5" />
          </Link>
          <Link href="/cart" aria-label="Cart" className={iconLink}>
            <ShoppingBag className="size-5" />
          </Link>
        </div>
      </Container>
    </header>
  );
}