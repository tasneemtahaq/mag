import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { ArtworkPlaceholder } from "@/components/products/artwork-placeholder";
import { getActiveCategories } from "@/lib/data/categories";

export async function CategoryGrid({
  limit,
  as = "h2",
}: {
  limit?: number;
  as?: "h1" | "h2";
}) {
  const all = await getActiveCategories();
  const categories = limit ? all.slice(0, limit) : all;
  if (categories.length === 0) return null;

  return (
    <section aria-label="Browse by category" className="bg-linen py-24 sm:py-32">
      <Container>
        <SectionHeading
          as={as}
          eyebrow="Browse"
          title="Explore by category"
          className="mb-14"
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/shop/${category.slug}`}
                className="group relative block aspect-4/3 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep"
              >
                <ArtworkPlaceholder className="absolute inset-0 to-ivory" />
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <h3 className="font-display text-2xl font-light">
                    {category.name}
                  </h3>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}