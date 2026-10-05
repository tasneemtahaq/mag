"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  addProductImages,
  getUploadSignature,
} from "@/actions/products/image-actions";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per photo

export function ImageUploader({ productId }: { productId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function uploadAll(files: File[]) {
    setFailed(false);

    const tooBig = files.find((file) => file.size > MAX_BYTES);
    if (tooBig) {
      setFailed(true);
      setStatus(`"${tooBig.name}" is larger than 10 MB. Please shrink it first.`);
      return;
    }

    setBusy(true);
    try {
      for (const [index, file] of files.entries()) {
        setStatus(`Uploading ${index + 1} of ${files.length}…`);

        // 1. Ask our server for permission (only admins get it)
        const signed = await getUploadSignature();

        // 2. Send the photo straight to Cloudinary
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signed.apiKey);
        body.append("timestamp", String(signed.timestamp));
        body.append("folder", signed.folder);
        body.append("signature", signed.signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          { method: "POST", body },
        );
        if (!response.ok) throw new Error("Cloudinary rejected the upload.");
        const result = await response.json();

        // 3. Save what Cloudinary stored. We save each photo as soon as it
        //    arrives, so one failure never loses the others.
        const saved = await addProductImages(productId, [
          {
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
          },
        ]);
        if (!saved.ok) throw new Error(saved.message);
      }
      setStatus(
        `${files.length} photo${files.length === 1 ? "" : "s"} uploaded.`,
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
      <label htmlFor="photos" className="mb-2 block text-sm font-medium">
        Add photos
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