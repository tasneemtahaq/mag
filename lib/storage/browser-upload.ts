import { getUploadSignature } from "@/actions/products/image-actions";
import type { UploadedImage } from "@/lib/validation/uploaded-image";

// 1. Ask our server for permission (only admins get it)
// 2. Send the photo straight to Cloudinary
export async function uploadToCloudinary(file: File): Promise<UploadedImage> {
  const signed = await getUploadSignature();

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
  if (!response.ok) {
    throw new Error("Cloudinary rejected the upload. Please try again.");
  }

  const result = (await response.json()) as {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };

  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  };
}
export type ReceiptSignature = {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  type: string;
  allowed_formats: string;
};

export async function uploadReceiptToCloudinary(
  file: File,
  signed: ReceiptSignature,
) {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signed.apiKey);
  body.append("timestamp", String(signed.timestamp));
  body.append("signature", signed.signature);
  body.append("folder", signed.folder);
  body.append("type", signed.type);
  body.append("allowed_formats", signed.allowed_formats);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
    { method: "POST", body },
  );
  if (!response.ok) {
    throw new Error(
      "The receipt could not be uploaded. Please use a JPG, PNG or WebP image under 10 MB.",
    );
  }

  const result = (await response.json()) as {
    public_id: string;
    format: string;
    width: number;
    height: number;
  };
  return {
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
  };
}