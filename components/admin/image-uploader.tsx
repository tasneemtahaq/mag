"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  addProductImages,
  discardUploadedImage,
} from "@/actions/products/image-actions";
import { uploadToCloudinary } from "@/lib/storage/browser-upload";
import { MAX_IMAGE_BYTES, MAX_PRODUCT_IMAGES } from "@/lib/storage/limits";

export function ImageUploader({
  productId,
  currentCount,
}: {
  productId: string;
  currentCount: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const remaining = Math.max(0, MAX_PRODUCT_IMAGES - currentCount);

  async function uploadAll(selected: File[]) {
    setFailed(false);

    // Only as many photos as there is room for
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

        // Save each photo as soon as it arrives, so one failure never loses the others
        const saved = await addProductImages(productId, [uploaded]);
        if (!saved.ok) {
          await discardUploadedImage(uploaded.publicId);
          throw new Error(saved.message);
        }
      }
      setStatus(
        `${files.length} photo${files.length === 1 ? "" : "s"} uploaded.` +
          (skipped > 0
            ? ` ${skipped} skipped, because the limit is ${MAX_PRODUCT_IMAGES} photos.`
            : ""),
      );
      router.refresh();
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

  return (
    <div>
      {remaining > 0 ? (
        <>
          <label htmlFor="photos" className="mb-2 block text-sm font-medium">
            Add photos ({remaining} more allowed)
          </label>
          <input
            ref={inputRef}
            id="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) void uploadAll(files);
            }}
            className="block w-full text-sm file:mr-4 file:cursor-pointer file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground disabled:opacity-50"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            JPG, PNG or WebP, up to 10 MB each. You can choose several at once.
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          This product has the maximum of {MAX_PRODUCT_IMAGES} photos. Delete
          one to add a different photo.
        </p>
      )}
      {status && (
        <p
          role={failed ? "alert" : "status"}
          className={failed ? "mt-3 text-sm text-destructive" : "mt-3 text-sm"}
        >
          {status}
        </p>
      )}
    </div>
  );
}