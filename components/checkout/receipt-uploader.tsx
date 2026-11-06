"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  getReceiptUploadSignature,
  submitReceipt,
} from "@/actions/orders/receipt-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadReceiptToCloudinary } from "@/lib/storage/browser-upload";
import { MAX_IMAGE_BYTES } from "@/lib/storage/limits";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ReceiptUploader({
  orderId,
  initialReference,
}: {
  orderId: string;
  initialReference: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState(initialReference);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setStatus(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus({ ok: false, text: "Please choose your receipt photo or screenshot first." });
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setStatus({
        ok: false,
        text: "Please choose a JPG, PNG or WebP image. A screenshot works well.",
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setStatus({ ok: false, text: "That image is larger than 10 MB. Please choose a smaller one." });
      return;
    }

    setBusy(true);
    try {
      // 1. Ask our server for permission  2. Send the file to Cloudinary  3. Save it on the order
      const signed = await getReceiptUploadSignature(orderId);
      if (!signed.ok) throw new Error(signed.message);

      const uploaded = await uploadReceiptToCloudinary(file, signed);

      const saved = await submitReceipt(orderId, uploaded, reference);
      if (!saved.ok) throw new Error(saved.message);

      setStatus({
        ok: true,
        text: "Thank you. We have your receipt and will check it shortly.",
      });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (error) {
      setStatus({
        ok: false,
        text:
          error instanceof Error
            ? error.message
            : "The upload did not work. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="receipt-file">Receipt photo or screenshot</Label>
        <input
          ref={fileRef}
          id="receipt-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="mt-2 block w-full text-sm file:mr-4 file:cursor-pointer file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground disabled:opacity-50"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          JPG, PNG or WebP, up to 10 MB.
        </p>
      </div>

      <div>
        <Label htmlFor="receipt-reference">Transaction ID (optional)</Label>
        <Input
          id="receipt-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          maxLength={60}
          autoComplete="off"
          className="mt-2"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          The number shown in your payment confirmation. It helps us find your
          payment faster.
        </p>
      </div>

      <Button type="button" size="lg" onClick={send} disabled={busy}>
        {busy ? "Sending…" : "Send receipt"}
      </Button>

      {status && (
        <p
          role={status.ok ? "status" : "alert"}
          className={status.ok ? "text-sm" : "text-sm text-destructive"}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}