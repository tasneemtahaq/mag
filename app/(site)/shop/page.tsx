import type { Metadata } from "next";
import { CategoryGrid } from "@/components/home/category-grid";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse original artwork, prints, calligraphy and more by category.",
};

export default function ShopPage() {
  return <CategoryGrid as="h1" />;
}