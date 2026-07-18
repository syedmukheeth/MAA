import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductListItem } from "@/components/shop/ProductListItem";
import { ShopToolbar, type SortValue } from "@/components/shop/ShopToolbar";
import { EmptyResults } from "@/components/shop/EmptyResults";
import { ROOM_CATEGORIES, CATEGORY_LABELS } from "@/lib/validations/product";
import type { Prisma } from "@/generated/prisma/client";

/** ISR instead of force-dynamic: this is a public, cacheable catalogue page. */
export const revalidate = 300;

/** Products per page. Unbounded findMany scans the whole table and renders it all. */
const PAGE_SIZE = 12;

type ProductsSearchParams = {
  category?: string;
  page?: string;
  q?: string;
  sort?: string;
  view?: string;
  wood?: string;
};

const SORT_MAP: Record<SortValue, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  name_asc: { name: "asc" },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}): Promise<Metadata> {
  const { category, q } = await searchParams;
  const active = ROOM_CATEGORIES.includes(category as (typeof ROOM_CATEGORIES)[number])
    ? (category as (typeof ROOM_CATEGORIES)[number])
    : undefined;

  const base = active ? `${CATEGORY_LABELS[active]} Furniture` : "All Furniture";
  const title = q?.trim() ? `"${q.trim()}" — ${base}` : base;
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
  searchParams: Promise<ProductsSearchParams>;
}) {
  const { category, page, q, sort, view, wood } = await searchParams;
  const activeCategory = ROOM_CATEGORIES.includes(
    category as (typeof ROOM_CATEGORIES)[number]
  )
    ? (category as (typeof ROOM_CATEGORIES)[number])
    : undefined;

  const query = q?.trim() || undefined;
  const activeSort: SortValue =
    sort && sort in SORT_MAP ? (sort as SortValue) : "newest";
  const listView = view === "list";
  const woodFilter = wood?.trim() || undefined;

  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(activeCategory ? { category: activeCategory } : {}),
    ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    ...(woodFilter
      ? {
          variants: {
            some: { woodType: { equals: woodFilter, mode: "insensitive" } },
          },
        }
      : {}),
  };

  const [products, totalCount, woodRows] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: SORT_MAP[activeSort],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.variant.findMany({
      where: { woodType: { not: null }, product: { isActive: true } },
      distinct: ["woodType"],
      select: { woodType: true },
      orderBy: { woodType: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const woodTypes = woodRows
    .map((w) => w.woodType)
    .filter((w): w is string => Boolean(w));

  const buildParams = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category: activeCategory,
      q: query,
      sort: activeSort === "newest" ? undefined : activeSort,
      view: listView ? "list" : undefined,
      wood: woodFilter,
      ...overrides,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    return params.toString();
  };

  const cardData = (p: (typeof products)[number]) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price.toString(),
    mrp: p.mrp?.toString() ?? null,
    category: p.category,
    images: p.images,
    stockQuantity: p.stockQuantity,
    lowStockThreshold: p.lowStockThreshold,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        All Furniture
      </h1>

      <div className="mt-6 flex flex-wrap gap-3">
        {(() => {
          const allParams = buildParams({ category: undefined, page: undefined });
          return (
            <Link
              href={allParams ? `/products?${allParams}` : "/products"}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                !activeCategory
                  ? "border-bronze bg-bronze text-ivory"
                  : "border-border text-graphite/70"
              }`}
            >
              All
            </Link>
          );
        })()}
        {ROOM_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/products?${buildParams({ category: c, page: undefined })}`}
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

      <div className="mt-8">
        <Suspense fallback={null}>
          <ShopToolbar listPath="/products" woodTypes={woodTypes} />
        </Suspense>
      </div>

      {listView ? (
        <div className="mt-8 flex flex-col gap-4">
          {products.map((p) => (
            <ProductListItem
              key={p.id}
              product={{ ...cardData(p), description: p.description }}
            />
          ))}
          {products.length === 0 && (
            <EmptyResults query={query} clearHref="/products" />
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={cardData(p)} />
          ))}
          {products.length === 0 && (
            <EmptyResults query={query} clearHref="/products" />
          )}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-14 flex items-center justify-center gap-2"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const qs = buildParams({ page: p > 1 ? String(p) : undefined });
            const href = qs ? `/products?${qs}` : "/products";
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
        {query ? ` matching "${query}"` : ""}
      </p>
    </div>
  );
}
