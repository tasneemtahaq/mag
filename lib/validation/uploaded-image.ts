import { z } from "zod";
import { MAX_PRODUCT_IMAGES, UPLOAD_FOLDER } from "@/lib/storage/limits";

// What the browser reports after Cloudinary has stored a photo.
// We only accept photos that live in OUR folder on Cloudinary.
export const uploadedImageSchema = z.object({
  publicId: z.string().startsWith(`${UPLOAD_FOLDER}/`),
  url: z.string().startsWith("https://res.cloudinary.com/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const uploadedImagesSchema = z
  .array(uploadedImageSchema)
  .max(MAX_PRODUCT_IMAGES);

export type UploadedImage = z.infer<typeof uploadedImageSchema>;