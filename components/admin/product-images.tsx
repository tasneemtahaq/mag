import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  deleteProductImage,
  moveProductImage,
  setMainImage,
} from "@/actions/products/image-actions";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_PRODUCT_IMAGES } from "@/lib/storage/limits";

type ProductImageItem = {
  id: string;
  url: string;
  alt: string | null;
  isMain: boolean;
};

const small = buttonVariants({ variant: "outline", size: "sm" });
const iconButton = buttonVariants({ variant: "ghost", size: "icon" });

export function ProductImages({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: ProductImageItem[];
}) {
  return (
      <div className="space-y-8">
       <p className="text-sm text-muted-foreground">
        {images.length} of {MAX_PRODUCT_IMAGES} photos
      </p>
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No photos yet. The first photo you upload becomes the main image.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="border border-border p-2">
              <div className="relative aspect-square bg-muted">
                <Image
                  src={image.url}
                  alt={image.alt ?? `${productName}, photo ${index + 1}`}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-1">
                <div className="flex">
                  <form action={moveProductImage}>
                    <input type="hidden" name="id" value={image.id} />
                    <input type="hidden" name="direction" value="left" />
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label={`Move photo ${index + 1} earlier`}
                      className={cn(iconButton, "disabled:opacity-30")}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                  </form>
                  <form action={moveProductImage}>
                    <input type="hidden" name="id" value={image.id} />
                    <input type="hidden" name="direction" value="right" />
                    <button
                      type="submit"
                      disabled={index === images.length - 1}
                      aria-label={`Move photo ${index + 1} later`}
                      className={cn(iconButton, "disabled:opacity-30")}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </form>
                </div>

                {image.isMain ? (
                  <Badge variant="secondary">Main</Badge>
                ) : (
                  <form action={setMainImage}>
                    <input type="hidden" name="id" value={image.id} />
                    <button type="submit" className={small}>
                      Make main
                    </button>
                  </form>
                )}
              </div>

              <form action={deleteProductImage} className="mt-2">
                <input type="hidden" name="id" value={image.id} />
                <button
                  type="submit"
                  className="text-xs text-destructive underline-offset-4 hover:underline"
                >
                  Delete photo
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

       <ImageUploader productId={productId} currentCount={images.length} />
    </div>
  );
}