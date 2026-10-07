import { NextResponse } from "next/server";
import { getCartCount } from "@/lib/data/cart";

// A tiny endpoint the navbar badge asks for the cart count.
// (The navbar can't read the cart itself without making every page slow.)
export async function GET() {
  const count = await getCartCount(true);
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}