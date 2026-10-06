"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { discardUploadedImage } from "@/actions/products/image-actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { uploadToCloudinary } from "@/lib/storage/browser-upload";
import { MAX_IMAGE_BYTES, MAX_PRODUCT_IMAGES } from "@/lib/storage/limits";
import type { UploadedImage } from "@/lib/validation/uploaded-image";

const small = buttonVariants({ variant: "outline", size: "sm" });

export function PhotoPicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const remaining = MAX_PRODUCT_IMAGES - images.length;

  async function addFiles(selected: File[]) {
    setFailed(false);

    const files = selected.slice(0, remaining);
    const skipped = selected.length - files.length;

    const tooBig = files.find((file) => file.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      setFailed(true);
      setStatus(`"${tooBig.name}" is larger than 10 MB. Please shrink it first.`);
      return;
    }

    setBusy(true);
    try {
      for (const [index, file] of files.entries()) {
        setStatus(`Uploading ${index + 1} of ${files.length}…`);
        const uploaded = await uploadToCloudinary(file);
        setImages((current) => [...current, uploaded]);
      }
      setStatus(
        skipped > 0
          ? `${skipped} skipped, because the limit is ${MAX_PRODUCT_IMAGES} photos.`
          : null,
      );
    } catch (error) {
      setFailed(true);
      setStatus(
        error instanceof Error ? error.message : "The upload did not work.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function makeMain(index: number) {
    setImages((current) => [
      current[index],
      ...current.filter((_, position) => position !== index),
    ]);
  }

  function remove(index: number) {
    const removed = images[index];
    setImages((current) => current.filter((_, position) => position !== index));
    // Also delete the file from Cloudinary, since it was never saved
    void discardUploadedImage(removed.publicId);
  }

  return (
    <div className="space-y-6">
      {/* The product form saves these together with the product */}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <p className="text-sm text-muted-foreground">
        {images.length} of {MAX_PRODUCT_IMAGES} photos. The first photo is the
        main one shown on the shop.
      </p>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.publicId} className="border border-border p-2">
              <div className="relative aspect-square bg-muted">
                <Image
                  src={image.url}
                  alt={`Photo ${index + 1}`}
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                {index === 0 ? (
                  <Badge variant="secondary">Main</Badge>
                ) : (
                  <button
                    type="button"
                    className={small}
                    onClick={() => makeMain(index)}
                  >
                    Make main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs text-destructive underline-offset-4 hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 ? (
        <div>
          <label htmlFor="new-photos" className="mb-2 block text-sm font-medium">
            Add photos ({remaining} more allowed)
          </label>
          <input
            ref={inputRef}
            id="new-photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) void addFiles(files);
            }}
            className="block w-full text-sm file:mr-4 file:cursor-pointer file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground disabled:opacity-50"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            JPG, PNG or WebP, up to 10 MB each. You can choose several at once.
            Wait for the uploads to finish before you press Create.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You have added the maximum of {MAX_PRODUCT_IMAGES} photos.
        </p>
      )}

      {status && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "text-sm text-destructive" : "text-sm"}
        >
          {status}
        </p>
      )}
    </div>
  );
}