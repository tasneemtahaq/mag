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