"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CART_EVENT } from "@/lib/cart/constants";
import { cn } from "@/lib/utils";

export function CartLink() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  // Ask the server for the count whenever the visitor moves to another page
  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart/count", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { count: number } | null) => {
        if (!cancelled && data) setCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // ...and instantly when something is added to the cart
  useEffect(() => {
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<number>).detail;
      if (typeof next === "number") setCount(next);
    };
    window.addEventListener(CART_EVENT, onChange);
    return () => window.removeEventListener(CART_EVENT, onChange);
  }, []);

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart"}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative",
      )}
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[0.6rem] font-medium text-ivory"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}