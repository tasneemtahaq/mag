import "server-only";
import { v2 as cloudinary } from "cloudinary";

// Every product photo is stored inside this Cloudinary folder
export const UPLOAD_FOLDER = "mohammadi-art-gallery/products";

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