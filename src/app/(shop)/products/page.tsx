import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
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
  best_sellers?: string;
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
  const [{ category, page, q, sort, view, best_sellers }, settings] = await Promise.all([
    searchParams,
    getSiteSettings(),
  ]);

  const activeCategory = ROOM_CATEGORIES.includes(
    category as (typeof ROOM_CATEGORIES)[number]
  )
    ? (category as (typeof ROOM_CATEGORIES)[number])
    : undefined;

  const query = q?.trim() || undefined;
  // "best_sellers" is a sort-menu entry that filters featured items while
  // keeping the newest ordering. Legacy ?best_sellers=1 links still work.
  const onlyBestSellers = sort === "best_sellers" || best_sellers === "1";
  const activeSort: SortValue =
    sort && sort in SORT_MAP ? (sort as SortValue) : "newest";
  const listView = view === "list";

  // Determine which categories to show in the filter pills
  let enabledCategories: (typeof ROOM_CATEGORIES)[number][] = [...ROOM_CATEGORIES];
  if (settings.shopSections) {
    try {
      const parsed = JSON.parse(settings.shopSections) as string[];
      const valid = parsed.filter((k): k is (typeof ROOM_CATEGORIES)[number] =>
        ROOM_CATEGORIES.includes(k as (typeof ROOM_CATEGORIES)[number])
      );
      if (valid.length > 0) enabledCategories = valid;
    } catch {
      // Malformed JSON — fall back to all categories
    }
  }

  // Admin-defined custom sections — rendered as extra pills that search by name.
  let customSections: string[] = [];
  if (settings.shopCustomSections) {
    try {
      const parsed = JSON.parse(settings.shopCustomSections) as unknown;
      if (Array.isArray(parsed)) {
        customSections = parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
      }
    } catch {
      // Malformed JSON — no custom sections
    }
  }

  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(activeCategory ? { category: activeCategory } : {}),
    ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    ...(onlyBestSellers ? { featured: true } : {}),
  };

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: SORT_MAP[activeSort],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const buildParams = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      category: activeCategory,
      q: query,
      sort: onlyBestSellers
        ? "best_sellers"
        : activeSort === "newest"
          ? undefined
          : activeSort,
      view: listView ? "list" : undefined,
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
    featured: p.featured,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        All Furniture
      </h1>

      <div className="mt-6 flex flex-wrap gap-3">
        {/* All */}
        {(() => {
          const allParams = buildParams({ category: undefined, page: undefined });
          return (
            <Link
              href={allParams ? `/products?${allParams}` : "/products"}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                !activeCategory
                  ? "border-bronze bg-bronze text-ivory"
                  : "border-border text-graphite/70 hover:border-bronze/50"
              }`}
            >
              All
            </Link>
          );
        })()}

        {/* Category pills — only show admin-enabled categories */}
        {enabledCategories.map((c) => (
          <Link
            key={c}
            href={`/products?${buildParams({ category: c, page: undefined })}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              activeCategory === c
                ? "border-bronze bg-bronze text-ivory"
                : "border-border text-graphite/70 hover:border-bronze/50"
            }`}
          >
            {CATEGORY_LABELS[c]}
          </Link>
        ))}

        {/* Custom section pills (admin-defined) — search by name */}
        {customSections.map((label) => {
          const isActive = !activeCategory && query?.toLowerCase() === label.toLowerCase();
          return (
            <Link
              key={label}
              href={`/products?q=${encodeURIComponent(label)}`}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                isActive
                  ? "border-bronze bg-bronze text-ivory"
                  : "border-border text-graphite/70 hover:border-bronze/50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <Suspense fallback={null}>
          <ShopToolbar listPath="/products" showBestSeller />
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
        {onlyBestSellers ? " (Best Sellers)" : ""}
      </p>
    </div>
  );
}
