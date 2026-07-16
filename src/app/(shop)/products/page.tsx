import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/ProductCard";
import { ROOM_CATEGORIES, CATEGORY_LABELS } from "@/lib/validations/product";

/** ISR instead of force-dynamic: this is a public, cacheable catalogue page. */
export const revalidate = 300;

/** Products per page. Unbounded findMany scans the whole table and renders it all. */
const PAGE_SIZE = 12;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const active = ROOM_CATEGORIES.includes(category as (typeof ROOM_CATEGORIES)[number])
    ? (category as (typeof ROOM_CATEGORIES)[number])
    : undefined;

  const title = active ? `${CATEGORY_LABELS[active]} Furniture` : "All Furniture";
  return {
    title,
    description: active
      ? `Handcrafted ${CATEGORY_LABELS[active].toLowerCase()} furniture, built to last. Delivered across India.`
      : "Browse the full MAA FURNITURE collection — handcrafted sofas, beds, dining and office furniture.",
    // Filtered views are near-duplicates of the parent; point ranking at one URL.
    alternates: { canonical: active ? `/products?category=${active}` : "/products" },
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page } = await searchParams;
  const activeCategory = ROOM_CATEGORIES.includes(
    category as (typeof ROOM_CATEGORIES)[number]
  )
    ? (category as (typeof ROOM_CATEGORIES)[number])
    : undefined;

  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const where = activeCategory ? { category: activeCategory } : undefined;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-14 flex items-center justify-center gap-2"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (activeCategory) params.set("category", activeCategory);
            if (p > 1) params.set("page", String(p));
            const href = params.toString() ? `/products?${params}` : "/products";
            const isCurrent = p === currentPage;
            return (
              <Link
                key={p}
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`min-w-9 rounded-full border px-3 py-1.5 text-center text-sm transition-colors ${
                  isCurrent
                    ? "border-bronze bg-bronze text-ivory"
                    : "border-border text-graphite/70 hover:border-bronze/50"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}

      <p className="mt-6 text-center text-xs text-graphite/50">
        {totalCount} {totalCount === 1 ? "piece" : "pieces"}
        {activeCategory ? ` in ${CATEGORY_LABELS[activeCategory]}` : ""}
      </p>
    </div>
  );
}
