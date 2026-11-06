import type { NextConfig } from "next";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  images: {
    // Let Cloudinary resize the pictures instead of Next.js,
    // so they no longer time out on a slow connection
    loader: "custom",
    loaderFile: "./cloudinary-loader.ts",

    // Only allow pictures from OUR Cloudinary account
    remotePatterns: cloudName
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloudName}/**`,
          },
        ]
      : [],
  },
  /* config options here */
};

export default nextConfig;