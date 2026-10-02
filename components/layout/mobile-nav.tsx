"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNav, utilityNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  // Browser state: is the menu open? This is why this file needs "use client".
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open menu"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "-ml-2",
        )}
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="left" className="w-[85%] max-w-sm bg-background p-0">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="font-display text-xl font-light uppercase tracking-[0.25em]">
            Menu
          </SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex flex-col px-6 py-2">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="border-b border-border py-4 font-display text-2xl font-light"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <nav
          aria-label="Account"
          className="flex flex-col gap-4 px-6 pt-6 text-sm uppercase tracking-[0.15em] text-muted-foreground"
        >
          {utilityNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}