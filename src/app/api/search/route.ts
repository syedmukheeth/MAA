import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchRatelimit } from "@/lib/redis";
import { clientIp, limitOrAllow } from "@/lib/rate-limit";

/**
 * Live search suggestions for the storefront search bar.
 * Case-insensitive contains match — intentionally forgiving, not exact.
 */
export async function GET(request: Request) {
  // Through limitOrAllow, not searchRatelimit.limit() directly: this used to
  // fail OPEN on any Redis error, so an Upstash outage (or an attacker
  // exhausting the Upstash quota) lifted the limit entirely on an unindexed
  // ILIKE scan against a 2-connection pool. limitOrAllow falls back to the
  // in-memory limiter instead of skipping the check.
  const allowed = await limitOrAllow(searchRatelimit, `search:${await clientIp()}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  // Capped before it reaches Prisma. `contains` is an unindexed ILIKE scan, and
  // a caller within the rate limit can otherwise send a 100KB term 60 times a
  // minute against a connection pool capped at 2 (src/lib/db.ts).
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const scope = searchParams.get("scope") === "combos" ? "combos" : "products";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (scope === "combos") {
    const combos = await prisma.combo.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: "insensitive" },
        items: { every: { product: { isActive: true } } },
      },
      select: { id: true, name: true, slug: true, bundlePrice: true, image: true },
      take: 8,
      orderBy: { name: "asc" },
    });
    return NextResponse.json({
      results: combos.map((c) => ({
        id: c.id,
        name: c.name,
        href: `/combos/${c.slug}`,
        price: c.bundlePrice.toString(),
        mrp: null,
        image: c.image,
      })),
    });
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { materials: { hasSome: [q] } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      mrp: true,
      images: true,
    },
    take: 8,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    results: products.map((p) => ({
      id: p.id,
      name: p.name,
      href: `/products/${p.slug}`,
      price: p.price.toString(),
      mrp: p.mrp?.toString() ?? null,
      image: p.images[0] ?? null,
    })),
  });
}
