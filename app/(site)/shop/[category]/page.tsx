import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { CategoryChips } from "@/components/products/category-chips";
import { ProductListing } from "@/components/products/product-listing";
import { getCategoryBySlug } from "@/lib/data/categories";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.seoTitle || category.name,
    description:
      category.seoDescription ||
      category.description ||
      `Browse ${category.name} at Muhammadi Art Gallery.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { sort, page } = await searchParams;
  const category = await getCategoryBySlug(slug);

  // Unknown, switched-off and archived categories all give a 404
  if (!category) notFound();

  return (
    <Container className="py-16 sm:py-24">
      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-xs uppercase tracking-[0.2em] text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-foreground">
            {category.name}
          </li>
        </ol>
      </nav>

      <SectionHeading
        as="h1"
        eyebrow="Category"
        title={category.name}
        description={category.description ?? undefined}
      />

      {category.subcategories.length > 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Includes: {category.subcategories.map((sub) => sub.name).join(" · ")}
        </p>
      )}

      <div className="mt-10">
        <CategoryChips currentSlug={category.slug} />
      </div>
      <div className="mt-10">
        <ProductListing
          basePath={`/shop/${category.slug}`}
          categorySlug={category.slug}
          sort={sort}
          page={page}
        />
      </div>
    </Container>
  );
}