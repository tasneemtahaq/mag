import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductPurchase } from "@/components/products/product-purchase";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getProductBySlug,
  getRelatedProducts,
  getVisibleProductSlugs,
} from "@/lib/data/products";
import { getSiteUrl } from "@/lib/site-url";
import { siteConfig } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

// Build the pages for every visible product in advance (fast).
// A product created later is built the first time somebody visits it.
export async function generateStaticParams() {
  const slugs = await getVisibleProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

function summaryOf(product: {
  seoDescription: string | null;
  shortDescription: string | null;
  description: string | null;
  name: string;
}) {
  return (
    product.seoDescription ||
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    `${product.name} at ${siteConfig.name}.`
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title =
    product.seoTitle ||
    (product.artist ? `${product.name} by ${product.artist}` : product.name);
  const description = summaryOf(product);
  const image = product.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${product.slug}`,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function editionText(number: number | null, total: number | null) {
  if (number && total) return `Edition ${number} of ${total}`;
  if (total) return `Limited edition of ${total}`;
  if (number) return `Edition ${number}`;
  return null;
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Unknown, hidden, archived and sold-out-of-variants products all give a 404
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categoryId, 3);

  const details = [
    { label: "Artist", value: product.artist },
    { label: "Category", value: product.category.name },
    { label: "Subcategory", value: product.subcategory?.name ?? null },
    { label: "Year", value: product.yearCreated?.toString() ?? null },
    { label: "Material", value: product.material },
    { label: "Medium", value: product.medium },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));

  const edition = editionText(product.editionNumber, product.totalEditions);
  const authenticity = [
    product.artworkType === "ORIGINAL" ? "Original artwork" : "Print",
    edition,
    product.isSigned ? "Signed by the artist" : null,
    product.hasCertificate ? "Certificate of authenticity included" : null,
  ].filter((line): line is string => Boolean(line));

  // ----- Structured data for search engines -----
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/products/${product.slug}`;
  const prices = product.variants.map((v) => v.salePrice ?? v.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const availability = product.variants.some((v) => v.stock > 0)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const single = product.variants.length === 1;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((image) => image.url),
    description: summaryOf(product),
    sku: single ? product.variants[0].sku : undefined,
    category: product.category.name,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: single
      ? {
          "@type": "Offer",
          url,
          priceCurrency: "PKR",
          price: lowest.toFixed(2),
          availability,
        }
      : {
          "@type": "AggregateOffer",
          url,
          priceCurrency: "PKR",
          lowPrice: lowest.toFixed(2),
          highPrice: highest.toFixed(2),
          offerCount: product.variants.length,
          availability,
        },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${siteUrl}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${siteUrl}/shop/${product.category.slug}`,
      },
      { "@type": "ListItem", position: 4, name: product.name, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />

      <Container className="py-12 sm:py-20">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/shop" className="hover:text-foreground">
                Shop
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/shop/${product.category.slug}`}
                className="hover:text-foreground"
              >
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-foreground">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          <div className="space-y-12">
            <header>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-gold-deep">
                {product.category.name}
              </p>
              <h1 className="font-display text-4xl font-light leading-tight sm:text-5xl">
                {product.name}
              </h1>
              {product.artist && (
                <p className="mt-3 text-lg text-muted-foreground">
                  {product.artist}
                </p>
              )}
              {product.shortDescription && (
                <p className="mt-6 leading-relaxed text-muted-foreground">
                  {product.shortDescription}
                </p>
              )}
            </header>

            <ProductPurchase variants={product.variants} />

            {product.description && (
              <section aria-labelledby="description-heading">
                <h2
                  id="description-heading"
                  className="mb-4 font-display text-2xl font-light"
                >
                  About this artwork
                </h2>
                <div className="space-y-4 leading-relaxed">
                  {product.description.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {details.length > 0 && (
              <section aria-labelledby="details-heading">
                <h2
                  id="details-heading"
                  className="mb-4 font-display text-2xl font-light"
                >
                  Details
                </h2>
                <dl className="divide-y divide-border border-y border-border text-sm">
                  {details.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-3 gap-4 py-3"
                    >
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="col-span-2">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section aria-labelledby="authenticity-heading">
              <h2
                id="authenticity-heading"
                className="mb-4 font-display text-2xl font-light"
              >
                Authenticity
              </h2>
              <ul className="space-y-2 text-sm">
                {authenticity.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-gold" />
                    {line}
                  </li>
                ))}
              </ul>
              {product.provenance && (
                <div className="mt-6">
                  <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Provenance
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed">
                    {product.provenance}
                  </p>
                </div>
              )}
            </section>

            <p className="border-t border-border pt-6 text-sm text-muted-foreground">
              Read about our{" "}
              <Link href="/shipping-policy" className="underline underline-offset-4">
                shipping
              </Link>{" "}
              and{" "}
              <Link href="/refund-policy" className="underline underline-offset-4">
                returns
              </Link>
              .
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section aria-label="Related artwork" className="mt-24 border-t border-border pt-16">
            <SectionHeading eyebrow="More to explore" title="You may also like" />
            <div className="mt-12">
              <ProductGrid products={related} />
            </div>
          </section>
        )}
      </Container>
    </>
  );
}