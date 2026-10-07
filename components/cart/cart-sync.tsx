"use client";

import { useEffect } from "react";
import { CART_EVENT } from "@/lib/cart/constants";

export function CartSync({ count }: { count: number }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: count }));
  }, [count]);

  return null;
}