import Image from "next/image";
import Link from "next/link";
import { ArtworkPlaceholder } from "@/components/products/artwork-placeholder";
import type { ProductCardData } from "@/lib/data/products";
import { formatPrice } from "@/lib/format";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  return (
    <article className="group">
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-deep"
      >
        {/* The whole artwork is shown, never cropped, on a soft mat */}
        <div className="relative aspect-4/5 overflow-hidden bg-linen">
          {product.image ? (
            <div className="absolute inset-4">
              <Image
                src={product.image.url}
                alt={
                  product.image.alt ??
                  (product.artist
                    ? `${product.name} by ${product.artist}`
                    : product.name)
                }
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                priority={priority}
                className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
          ) : (
            <ArtworkPlaceholder className="absolute inset-0" />
          )}
          {!product.inStock && (
            <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-ivory">
              Sold
            </span>
          )}
        </div>

        <div className="mt-5 space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {product.category}
          </p>
          <h3 className="font-display text-2xl font-light">{product.name}</h3>
          {product.artist && (
            <p className="text-sm text-muted-foreground">{product.artist}</p>
          )}
          <p className="pt-1 text-sm">
            {product.hasPriceRange && (
              <span className="text-muted-foreground">From </span>
            )}
            <span className={product.compareAtPrice ? "text-gold-deep" : undefined}>
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="ml-2 text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </p>
        </div>
      </Link>
    </article>
  );
}