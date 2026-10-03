import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProductCard } from "@/components/products/product-card";
import { getFeaturedProducts } from "@/lib/data/products";

export async function FeaturedArtwork() {
  const products = await getFeaturedProducts();
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
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}