import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";
import { ROOM_CATEGORIES, CATEGORY_LABELS } from "@/lib/validations/product";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = ROOM_CATEGORIES.includes(
    category as (typeof ROOM_CATEGORIES)[number]
  )
    ? (category as (typeof ROOM_CATEGORIES)[number])
    : undefined;

  const products = await prisma.product.findMany({
    where: activeCategory ? { category: activeCategory } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        All Furniture
      </h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/products"
          className={`rounded-full border px-4 py-1.5 text-sm ${
            !activeCategory
              ? "border-bronze bg-bronze text-ivory"
              : "border-border text-graphite/70"
          }`}
        >
          All
        </Link>
        {ROOM_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/products?category=${c}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              activeCategory === c
                ? "border-bronze bg-bronze text-ivory"
                : "border-border text-graphite/70"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price.toString(),
              category: p.category,
              images: p.images,
              stockQuantity: p.stockQuantity,
              lowStockThreshold: p.lowStockThreshold,
            }}
          />
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-center text-graphite/60">
            No products in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
