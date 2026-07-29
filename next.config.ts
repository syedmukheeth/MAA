import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg / @prisma/adapter-pg use Node built-ins (dns, fs, net, tls). Server
  // Actions pull their whole module graph in for the client reference stub,
  // so without this Turbopack tries to bundle pg for the browser and fails.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
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
  // The checkout and the whole back office are cookie-authenticated with
  // SameSite=Lax, so framing is the one gap that leaves: an attacker's page can
  // embed /admin or /checkout and harvest clicks. Nothing here needs to be
  // framed by anyone.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
