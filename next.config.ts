import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Uploaded product/combo images land here via the signed Cloudinary
      // upload. Without this, next/image throws on every real product page —
      // only the Unsplash seed data renders.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Seed placeholders only.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
