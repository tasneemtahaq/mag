"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Expand, X } from "lucide-react";
import { ArtworkPlaceholder } from "@/components/products/artwork-placeholder";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; alt: string | null };

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] w-full">
        <ArtworkPlaceholder className="absolute inset-0" />
      </div>
    );
  }

  const current = images[active];
  const altFor = (image: GalleryImage, index: number) =>
    image.alt ?? `${productName}, photo ${index + 1} of ${images.length}`;

  return (
    <div>
      {/* The whole artwork is shown, never cropped */}
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="View this photo larger"
        className="group relative block aspect-[4/5] w-full cursor-zoom-in bg-linen"
      >
        <Image
          src={current.url}
          alt={altFor(current, active)}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-4"
        />
        <span
          aria-hidden
          className="absolute bottom-3 right-3 flex size-9 items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Expand className="size-4" />
        </span>
      </button>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "relative block aspect-square w-full bg-linen outline-offset-2 transition-opacity",
                  index === active
                    ? "outline outline-2 outline-ink"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-contain p-1"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* The browser's own dialog: Escape closes it, focus stays inside it,
          and its images are only downloaded once it is opened */}
      <dialog
        ref={dialogRef}
        aria-label={`${productName}, enlarged photo`}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-ink/95 p-0"
      >
        <div
          className="relative h-full w-full cursor-zoom-out"
          onClick={() => dialogRef.current?.close()}
        >
          <Image
            src={current.url}
            alt={altFor(current, active)}
            fill
            sizes="100vw"
            className="object-contain p-6"
          />
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close enlarged photo"
          className="absolute right-4 top-4 flex size-11 items-center justify-center bg-ivory/10 text-ivory hover:bg-ivory/20"
        >
          <X className="size-5" />
        </button>
      </dialog>
    </div>
  );
}