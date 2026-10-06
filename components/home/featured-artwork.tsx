import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProductGrid } from "@/components/products/product-grid";
import { getFeaturedProducts } from "@/lib/data/products";

export async function FeaturedArtwork() {
  const products = await getFeaturedProducts(3);
  if (products.length === 0) return null;

  return (
    <section aria-label="Featured artwork" className="py-24 sm:py-32">
      <Container>
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="Featured" title="Selected artwork" />
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.2em] underline-offset-8 hover:underline"
          >
            View all artwork
          </Link>
        </div>
        <ProductGrid products={products} />
      </Container>
    </section>
  );
}