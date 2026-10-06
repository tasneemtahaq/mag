import { ProductCard } from "@/components/products/product-card";
import type { ProductCardData } from "@/lib/data/products";

export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: ProductCardData[];
  // How many of the first images to load immediately (those at the top of the page)
  priorityCount?: number;
}) {
  return (
    <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}