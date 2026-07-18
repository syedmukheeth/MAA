"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { SearchBar } from "@/components/shop/SearchBar";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

/**
 * Search + sort + wood filter + grid/list toggle. All state lives in the URL
 * so results stay shareable and pagination keeps the context.
 */
export function ShopToolbar({
  scope = "products",
  listPath = "/products",
  woodTypes = [],
  showViewToggle = true,
}: {
  scope?: "products" | "combos";
  listPath?: string;
  woodTypes?: string[];
  showViewToggle?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname, searchParams]
  );

  const sort = searchParams.get("sort") ?? "newest";
  const wood = searchParams.get("wood") ?? "";
  const view = searchParams.get("view") === "list" ? "list" : "grid";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex-1">
        <SearchBar
          scope={scope}
          listPath={listPath}
          initialQuery={searchParams.get("q") ?? ""}
          placeholder={
            scope === "combos" ? "Search combo offers..." : "Search furniture..."
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-graphite/60">
          Sort
          <select
            value={sort}
            onChange={(e) =>
              setParam("sort", e.target.value === "newest" ? null : e.target.value)
            }
            className="h-9 rounded-full border border-border bg-white/70 px-3 text-sm text-charcoal outline-none focus:border-bronze"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {woodTypes.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-graphite/60">
            Wood
            <select
              value={wood}
              onChange={(e) => setParam("wood", e.target.value || null)}
              className="h-9 rounded-full border border-border bg-white/70 px-3 text-sm text-charcoal outline-none focus:border-bronze"
            >
              <option value="">All woods</option>
              {woodTypes.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        )}

        {showViewToggle && (
          <div
            role="group"
            aria-label="View"
            className="flex overflow-hidden rounded-full border border-border"
          >
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setParam("view", null)}
              className={`flex h-9 w-10 items-center justify-center transition-colors ${
                view === "grid"
                  ? "bg-bronze text-ivory"
                  : "bg-white/70 text-graphite/60 hover:text-charcoal"
              }`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setParam("view", "list")}
              className={`flex h-9 w-10 items-center justify-center transition-colors ${
                view === "list"
                  ? "bg-bronze text-ivory"
                  : "bg-white/70 text-graphite/60 hover:text-charcoal"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
