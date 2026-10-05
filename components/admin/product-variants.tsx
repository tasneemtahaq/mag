import {
  createVariant,
  deleteVariant,
  updateVariant,
} from "@/actions/products/variant-actions";
import { VariantForm } from "@/components/admin/variant-form";
import type { SizeOption } from "@/components/admin/variant-form";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

type DecimalLike = { toString(): string; toNumber(): number };

type VariantItem = {
  id: string;
  name: string;
  sku: string;
  sizeId: string | null;
  price: DecimalLike;
  salePrice: DecimalLike | null;
  stock: number;
  widthCm: DecimalLike | null;
  heightCm: DecimalLike | null;
  depthCm: DecimalLike | null;
  weightGrams: number | null;
  isActive: boolean;
};

export function ProductVariants({
  productId,
  variants,
  sizes,
}: {
  productId: string;
  variants: VariantItem[];
  sizes: SizeOption[];
}) {
  return (
    <div className="space-y-4">
      {variants.map((variant) => (
        <details key={variant.id} className="border border-border">
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <span className="font-medium">{variant.name}</span>
            <span className="text-sm text-muted-foreground">
              {variant.sku} · {formatPrice(variant.price.toNumber())} ·{" "}
              {variant.stock} in stock
            </span>
            {!variant.isActive && <Badge variant="outline">Hidden</Badge>}
          </summary>

          <div className="space-y-6 border-t border-border p-4">
            <VariantForm
              prefix={`variant-${variant.id}`}
              action={updateVariant.bind(null, variant.id)}
              sizes={sizes}
              submitLabel="Save variant"
              savedText="Saved."
              initial={{
                name: variant.name,
                sku: variant.sku,
                sizeId: variant.sizeId ?? "",
                price: variant.price.toString(),
                salePrice: variant.salePrice?.toString() ?? "",
                stock: String(variant.stock),
                widthCm: variant.widthCm?.toString() ?? "",
                heightCm: variant.heightCm?.toString() ?? "",
                depthCm: variant.depthCm?.toString() ?? "",
                weightGrams: variant.weightGrams?.toString() ?? "",
                isActive: variant.isActive,
              }}
            />
            <form action={deleteVariant}>
              <input type="hidden" name="id" value={variant.id} />
              <button
                type="submit"
                className="text-xs text-destructive underline-offset-4 hover:underline"
              >
                Delete this variant
              </button>
            </form>
          </div>
        </details>
      ))}

      <details open={variants.length === 0} className="border border-dashed border-border">
        <summary className="cursor-pointer px-4 py-3 font-medium">
          Add a variant
        </summary>
        <div className="border-t border-border p-4">
          <VariantForm
            prefix="new-variant"
            action={createVariant.bind(null, productId)}
            sizes={sizes}
            submitLabel="Add variant"
            savedText="Variant added."
          />
        </div>
      </details>
    </div>
  );
}