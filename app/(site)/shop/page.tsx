import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { CategoryChips } from "@/components/products/category-chips";
import { ProductListing } from "@/components/products/product-listing";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse original artwork, prints, calligraphy and more at Muhammadi Art Gallery.",
};

type Props = {
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const { sort, page } = await searchParams;

  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading as="h1" eyebrow="Shop" title="All artwork" />
      <div className="mt-10">
        <CategoryChips />
      </div>
      <div className="mt-10">
        <ProductListing basePath="/shop" sort={sort} page={page} />
      </div>
    </Container>
  );
}