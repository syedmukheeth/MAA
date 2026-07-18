import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Generated from the database, not hand-written: a static sitemap goes stale
 * the first time someone adds a product, and a sitemap that lists URLs which
 * don't exist is worse than none.
 *
 * Only public routes belong here. /cart, /checkout, /account and /admin all
 * require a session — listing them would point crawlers at redirects.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/combos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/custom-studio`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/showroom`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const [products, combos] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.combo.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...products.map((p) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...combos.map((c) => ({
        url: `${base}/combos/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (err) {
    // A database blip must not produce an empty sitemap — Google treats that as
    // "these pages are gone". Serve the static routes and try again next hour.
    console.error("sitemap: could not load products/combos", err);
    return staticRoutes;
  }
}
