import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Live search suggestions for the storefront search bar.
 * Case-insensitive contains match — intentionally forgiving, not exact.
 */
export async function GET(request: Request) {
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
