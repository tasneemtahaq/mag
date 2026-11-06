import "server-only";
import { v2 as cloudinary } from "cloudinary";
import {
  RECEIPT_FOLDER,
  RECEIPT_FORMATS,
  UPLOAD_FOLDER,
} from "@/lib/storage/limits";

export { UPLOAD_FOLDER };

function getConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not set up. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return { cloudName, apiKey, apiSecret };
}

// A one-time permission slip for ONE browser upload into our folder
export function createUploadSignature() {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { folder: UPLOAD_FOLDER, timestamp },
    apiSecret,
  );
  return { cloudName, apiKey, timestamp, folder: UPLOAD_FOLDER, signature };
}

export async function deleteImage(publicId: string) {
  getConfig();
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}

// ---------- Payment receipts ----------
// Receipts are PRIVATE: the type "authenticated" means they can only be opened
// through a link signed by this server, never by guessing their address.
export function createReceiptUploadSignature() {
  const { cloudName, apiKey, apiSecret } = getConfig();
  const timestamp = Math.round(Date.now() / 1000);
  // Every one of these is signed, and the browser must send them unchanged
  const params = {
    allowed_formats: RECEIPT_FORMATS,
    folder: RECEIPT_FOLDER,
    timestamp,
    type: "authenticated",
  };
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);
  return { cloudName, apiKey, signature, ...params };
}

// A signed link for an admin to view a receipt (width makes a small preview)
export function signedReceiptUrl(
  publicId: string,
  format: string | null,
  width?: number,
) {
  getConfig();
  return cloudinary.url(publicId, {
    resource_type: "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    ...(format ? { format } : {}),
    ...(width ? { transformation: [{ width, crop: "limit" }] } : {}),
  });
}