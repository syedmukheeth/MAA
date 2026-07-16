/**
 * Canonical origin for absolute URLs (sitemap, OpenGraph, JSON-LD).
 *
 * Metadata cannot use relative URLs — a crawler or a WhatsApp unfurler has no
 * base to resolve them against. Vercel injects VERCEL_PROJECT_PRODUCTION_URL on
 * every deployment, which is stable across preview builds (unlike VERCEL_URL,
 * which changes per deploy and would poison canonicals with preview domains).
 *
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is live — it wins over everything.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_NAME = "MAA FURNITURE";
