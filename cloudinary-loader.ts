"use client";

// Asks Cloudinary for the image at the right size and best format,
// so Next.js doesn't have to download and shrink it itself
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Images that aren't from Cloudinary are left as they are
  if (!src.includes("res.cloudinary.com")) return src;

  const settings = [
    "f_auto", // best format for the browser (webp/avif)
    "c_limit", // never make an image bigger than it really is
    `w_${width}`, // the width the page needs
    `q_${quality || "auto"}`, // good quality, small file
  ].join(",");

  return src.replace("/upload/", `/upload/${settings}/`);
}