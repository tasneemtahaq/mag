import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteProduct,
  setProductStatus,
  updateProduct,
} from "@/actions/products/admin-actions";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImages } from "@/components/admin/product-images";
import { Button } from "@/components/ui/button";
import {
  getAdminProduct,
  getProductFormOptions,
} from "@/lib/data/admin-products";

export const metadata: Metadata = { title: "Edit product" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { created } = await searchParams;

  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getProductFormOptions(),
  ]);
  if (!product) notFound();

  const variant = product.variants[0];

  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Link href="/admin/products" className="hover:text-foreground">
          Products
        </Link>
      </p>
      <h1 className="mt-3 font-display text-4xl font-light">{product.name}</h1>

      {created && (
        <p
          role="status"
          className="mt-4 border border-border bg-muted px-4 py-3 text-sm"
        >
          Product created. Add its photos below.
        </p>
      )}

      <section aria-labelledby="photos-heading" className="mt-10">
        <h2 id="photos-heading" className="mb-6 font-display text-2xl font-light">
          Photos
        </h2>
        <ProductImages
          productId={product.id}
          productName={product.name}
          images={product.images}
        />
      </section>

      <div className="mt-16 border-t border-border pt-12">
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          categories={categories}
          submitLabel="Save changes"
          initial={{
            name: product.name,
            slug: product.slug,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId ?? "",
            artist: product.artist ?? "",
            shortDescription: product.shortDescription ?? "",
            description: product.description ?? "",
            material: product.material ?? "",
            medium: product.medium ?? "",
            tags: product.tags.join(", "),
            yearCreated: product.yearCreated?.toString() ?? "",
            artworkType: product.artworkType,
            editionNumber: product.editionNumber?.toString() ?? "",
            totalEditions: product.totalEditions?.toString() ?? "",
            hasCertificate: product.hasCertificate,
            isSigned: product.isSigned,
            provenance: product.provenance ?? "",
            isFeatured: product.isFeatured,
            status: product.status,
            sku: variant?.sku ?? "",
            price: variant?.price.toString() ?? "",
            salePrice: variant?.salePrice?.toString() ?? "",
            stock: variant?.stock.toString() ?? "0",
            widthCm: variant?.widthCm?.toString() ?? "",
            heightCm: variant?.heightCm?.toString() ?? "",
            depthCm: variant?.depthCm?.toString() ?? "",
            weightGrams: variant?.weightGrams?.toString() ?? "",
          }}
        />
      </div>

      <section
        aria-labelledby="danger"
        className="mt-16 space-y-10 border-t border-border pt-10"
      >
        <h2 id="danger" className="font-display text-2xl font-light">
          Archive or delete
        </h2>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Archiving hides the product from the website but keeps everything,
            so you can activate it again later.
          </p>
          <form action={setProductStatus}>
            <input type="hidden" name="id" value={product.id} />
            <input
              type="hidden"
              name="status"
              value={product.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED"}
            />
            <Button type="submit" variant="outline">
              {product.status === "ARCHIVED"
                ? "Activate product"
                : "Archive product"}
            </Button>
          </form>
        </div>

        <form action={deleteProduct} className="space-y-4">
          <input type="hidden" name="id" value={product.id} />
          <p className="text-sm text-muted-foreground">
            Deleting removes the product from the admin and the website. Past
            orders that include it are not affected.
          </p>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="confirm"
              required
              className="mt-0.5 size-4 accent-destructive"
            />
            <span>I understand this removes the product.</span>
          </label>
          <Button type="submit" variant="destructive">
            Delete product
          </Button>
        </form>
      </section>
    </div>
  );
}