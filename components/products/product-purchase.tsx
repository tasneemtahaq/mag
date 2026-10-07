"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDimensions, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PurchaseVariant = {
  id: string;
  name: string;
  sku: string;
  sizeName: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  weightGrams: number | null;
};

const MAX_QUANTITY = 10;

function formatWeight(grams: number) {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`;
}

export function ProductPurchase({ variants }: { variants: PurchaseVariant[] }) {
  // Start on the first option that can actually be bought
  const first = variants.find((item) => item.stock > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(first?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const variant = variants.find((item) => item.id === variantId) ?? first;
  if (!variant) return null;

  const soldOut = variant.stock <= 0;
  const maxQuantity = Math.min(variant.stock, MAX_QUANTITY);
  const price = variant.salePrice ?? variant.price;
  const dimensions = formatDimensions(
    variant.widthCm,
    variant.heightCm,
    variant.depthCm,
  );

  function choose(id: string) {
    setVariantId(id);
    setQuantity(1);
  }

  return (
    <div className="space-y-8">
      <p className="text-2xl">
        <span className={variant.salePrice ? "text-gold-deep" : undefined}>
          {formatPrice(price)}
        </span>
        {variant.salePrice && (
          <span className="ml-3 text-base text-muted-foreground line-through">
            {formatPrice(variant.price)}
          </span>
        )}
      </p>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Choose an option
          </legend>
          <div className="flex flex-wrap gap-3">
            {variants.map((item) => (
              <label key={item.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="variant"
                  value={item.id}
                  checked={item.id === variantId}
                  onChange={() => choose(item.id)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block border border-border px-4 py-3 text-sm transition-colors hover:border-ink",
                    "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory",
                    "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep",
                    item.stock <= 0 && "text-muted-foreground line-through",
                  )}
                >
                  {item.name}
                  <span className="mt-0.5 block text-xs opacity-70">
                    {formatPrice(item.salePrice ?? item.price)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <dl className="space-y-1 text-sm text-muted-foreground">
        {variant.sizeName && (
          <div>
            <dt className="inline">Size: </dt>
            <dd className="inline text-foreground">{variant.sizeName}</dd>
          </div>
        )}
        {dimensions && (
          <div>
            <dt className="inline">Dimensions: </dt>
            <dd className="inline text-foreground">{dimensions}</dd>
          </div>
        )}
        {variant.weightGrams && (
          <div>
            <dt className="inline">Weight: </dt>
            <dd className="inline text-foreground">
              {formatWeight(variant.weightGrams)}
            </dd>
          </div>
        )}
        <div>
          <dt className="inline">SKU: </dt>
          <dd className="inline">{variant.sku}</dd>
        </div>
      </dl>

      <p aria-live="polite" className="text-sm">
        {soldOut
          ? "Sold"
          : variant.stock <= 3
            ? `Only ${variant.stock} available`
            : "In stock"}
      </p>

      {maxQuantity > 1 && (
        <div>
          <label
            htmlFor="quantity"
            className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            Quantity
          </label>
          <select
            id="quantity"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="flex h-10 w-24 border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {Array.from({ length: maxQuantity }, (_, index) => index + 1).map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ),
            )}
          </select>
        </div>
      )}

      {/* The real cart arrives in Phase 13. Until then the button stays off. */}
      <div className="space-y-3">
        <Button size="lg" className="w-full" disabled>
          {soldOut ? "Sold" : "Add to cart"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Online ordering opens soon. To ask about this artwork,{" "}
          <Link href="/contact" className="underline underline-offset-4">
            contact the gallery
          </Link>
          .
        </p>
      </div>
    </div>
  );
}