import type { Metadata } from "next";
import Link from "next/link";
import { createProduct } from "@/actions/products/admin-actions";
import { ProductForm } from "@/components/admin/product-form";
import { getProductFormOptions } from "@/lib/data/admin-products";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await getProductFormOptions();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl font-light">New product</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        You can add photos right after saving.
      </p>

      <div className="mt-10">
        {categories.length === 0 ? (
          <p className="text-muted-foreground">
            Create a{" "}
            <Link href="/admin/categories/new" className="underline">
              category
            </Link>{" "}
            first. Every product belongs to one.
          </p>
        ) : (
          <ProductForm
            action={createProduct}
            categories={categories}
            submitLabel="Create product"
          />
        )}
      </div>
    </div>
  );
}