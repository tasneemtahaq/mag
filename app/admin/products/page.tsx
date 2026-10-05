import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { setProductStatus } from "@/actions/products/admin-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminProducts } from "@/lib/data/admin-products";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Products" };

const small = buttonVariants({ variant: "outline", size: "sm" });

const statusLabel = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
} as const;

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-light">Products</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          <Plus className="size-4" />
          New product
        </Link>
      </div>

      <div className="mt-10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Photo</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const variant = product.variants[0];
              const stock = product.variants.reduce(
                (sum, item) => sum + item.stock,
                0,
              );
              const photo = product.images[0];
              const nextStatus =
                product.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {photo ? (
                      <Image
                        src={photo.url}
                        alt={photo.alt ?? product.name}
                        width={56}
                        height={56}
                        className="size-14 object-cover"
                      />
                    ) : (
                      <div className="size-14 bg-muted" aria-hidden />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="hover:underline"
                    >
                      {product.name}
                    </Link>
                    {product.isFeatured && (
                      <span className="ml-2 text-xs text-gold-deep">
                        Featured
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {variant ? formatPrice(variant.price.toNumber()) : "—"}
                  </TableCell>
                  <TableCell className="text-right">{stock}</TableCell>
                  <TableCell>
                    <Badge
                      variant={product.status === "ACTIVE" ? "secondary" : "outline"}
                    >
                      {statusLabel[product.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <form action={setProductStatus}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="status" value={nextStatus} />
                        <button type="submit" className={small}>
                          {product.status === "ACTIVE" ? "Archive" : "Activate"}
                        </button>
                      </form>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className={small}
                      >
                        Edit
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {products.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No products yet. Create the first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}