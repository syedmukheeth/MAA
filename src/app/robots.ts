import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * The catalogue is public and must be crawlable. Everything behind a session is
 * explicitly disallowed — not because it's secret (the proxy enforces that), but
 * because crawling it wastes budget on redirects to /login and can surface
 * order-confirmation URLs in search.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/cart", "/checkout", "/api/", "/403", "/login", "/register"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
