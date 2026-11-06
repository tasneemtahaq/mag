// The limit on photos per product, and the Cloudinary folder they live in.
// Change MAX_PRODUCT_IMAGES here and it changes everywhere.
export const MAX_PRODUCT_IMAGES = 4;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB per photo
export const UPLOAD_FOLDER = "muhammadi-art-gallery/products";
// Payment receipts (private files, a different folder from artwork photos)
export const RECEIPT_FOLDER = "mohammadi-art-gallery/receipts";
export const RECEIPT_FORMATS = "jpg,jpeg,png,webp";
// Allows for a few re-uploads if a receipt is rejected
export const MAX_RECEIPTS_PER_ORDER = 5;