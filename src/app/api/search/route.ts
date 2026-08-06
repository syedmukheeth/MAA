import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchRatelimit } from "@/lib/redis";

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Live search suggestions for the storefront search bar.
 * Case-insensitive contains match — intentionally forgiving, not exact.
 */
export async function GET(request: Request) {
  // Rate limit to prevent DB abuse from bots
  try {
    const ip = await clientIp();
    const { success } = await searchRatelimit.limit(`search:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  } catch {
    // Fail open for search — degraded search is better than no search
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
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
