import Link from "next/link";
import { ArtworkPlaceholder } from "@/components/products/artwork-placeholder";
import type { ProductSummary } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <article className="group">
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep"
      >
        <ArtworkPlaceholder className="aspect-4/5 w-full" />
        <div className="mt-5 space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {product.category}
          </p>
          <h3 className="font-display text-2xl font-light">{product.name}</h3>
          {product.artist && (
            <p className="text-sm text-muted-foreground">{product.artist}</p>
          )}
          <p className="pt-1 text-sm">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </article>
  );
}