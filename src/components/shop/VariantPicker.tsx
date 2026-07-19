"use client";

import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { motion, AnimatePresence } from "framer-motion";

export type VariantOption = {
  id: string;
  name: string;
  woodType: string | null;
  finish: string | null;
  size: string | null;
  priceDelta: number;
  stock: number;
  lowStockThreshold: number;
  isDefault: boolean;
  image?: string | null;
};

const ATTRIBUTES = [
  { key: "woodType", label: "Wood" },
  { key: "finish", label: "Finish" },
  { key: "size", label: "Size" },
] as const;

type AttrKey = (typeof ATTRIBUTES)[number]["key"];

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    value
  );
}

/**
 * Timber swatches shown next to each variant.
 *
 * These hex values are deliberately literal and deliberately NOT theme tokens:
 * the colour here *is the product data* — an approximation of what the wood
 * actually looks like. It must not shift with the theme, because teak is teak.
 * (token-lint allows this file for that reason; see brand-system.)
 *
 * Keyed by substring so "Solid Teak" and "Teak / Natural" both match.
 */
const WOOD_SWATCHES: ReadonlyArray<readonly [match: string[], hex: string]> = [
  [["teak"], "#8B5E3C"],
  [["walnut"], "#5C4033"],
  [["oak"], "#C2A278"],
  [["mahogany"], "#4A2511"],
  [["rosewood", "sheesham"], "#3D1E12"],
  [["ash"], "#E3D4C1"],
];

function getWoodColorHex(wood: string | null): string | null {
  if (!wood) return null;
  const w = wood.toLowerCase().trim();
  for (const [names, hex] of WOOD_SWATCHES) {
    if (names.some((n) => w.includes(n))) return hex;
  }
  return null;
}

export function VariantPicker({
  productId,
  basePrice,
  mrp = null,
  variants,
  selectedId: controlledSelectedId,
  onSelect: controlledOnSelect,
}: {
  productId: string;
  basePrice: number;
  mrp?: number | null;
  variants: VariantOption[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(
    variants.find((v) => v.isDefault && v.stock > 0)?.id ??
      variants.find((v) => v.stock > 0)?.id ??
      variants[0]?.id
  );

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const onSelect = controlledOnSelect !== undefined ? controlledOnSelect : setInternalSelectedId;

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  // Which attributes actually vary across variants
  const activeAttrs = useMemo(
    () =>
      ATTRIBUTES.filter(({ key }) =>
        variants.some((v) => v[key] !== null && v[key] !== "")
      ),
    [variants]
  );

  const price = basePrice + (selected?.priceDelta ?? 0);
  // MRP is fixed per product; the discount is recomputed against the
  // delta-adjusted selling price and hidden if the delta erases it.
  const hasOffer = mrp !== null && mrp > price;
  const offPct = hasOffer ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const inStock = (selected?.stock ?? 0) > 0;
  const lowStock =
    inStock && (selected?.stock ?? 0) <= (selected?.lowStockThreshold ?? 0);

  // Group variants as selectable rows when attributes exist; otherwise pills by name
  const usePills = activeAttrs.length === 0;

  return (
    <div>
      <div className="overflow-hidden h-10 flex flex-col justify-center">
        <AnimatePresence mode="popLayout">
          <motion.p
            key={price}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-baseline gap-2 text-2xl font-semibold text-charcoal"
          >
            <span>&#8377;{formatInr(price)}</span>
            {hasOffer && (
              <>
                <span className="text-base font-normal text-graphite/50 line-through">
                  &#8377;{formatInr(mrp)}
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {offPct}% off
                </span>
              </>
            )}
          </motion.p>
        </AnimatePresence>
      </div>

      <p className="mt-1.5 text-xs font-semibold tracking-wide">
        {!inStock ? (
          <span className="text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full">Out of stock</span>
        ) : lowStock ? (
          <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Only {selected.stock} left</span>
        ) : (
          <span className="text-sage bg-sage/10 px-2.5 py-1 rounded-full">In stock</span>
        )}
      </p>

      {variants.length > 1 && (
        <div className="mt-6 space-y-4">
          {usePills ? (
            <VariantPillRow
              label="Option"
              variants={variants}
              selectedId={selectedId}
              onSelect={onSelect}
              display={(v) => v.name}
            />
          ) : (
            <div className="space-y-2.5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-graphite/50">
                {activeAttrs.map((a) => a.label).join(" / ")}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {variants.map((v) => {
                  const label =
                    activeAttrs
                      .map((a) => v[a.key as AttrKey])
                      .filter(Boolean)
                      .join(" · ") || v.name;
                  const isSelected = v.id === selectedId;
                  const woodColor = getWoodColorHex(v.woodType);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onSelect(v.id)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4.5 py-2 text-xs uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "border-[#B08D57] bg-[#B08D57] text-ivory scale-[1.02] shadow-sm"
                          : v.stock > 0
                            ? "border-linen text-graphite/80 bg-white/40 hover:border-bronze/60 hover:bg-white"
                            : "border-linen/40 text-graphite/30 line-through bg-transparent"
                      }`}
                    >
                      {woodColor && (
                        <span
                          className="inline-block size-3.5 shrink-0 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: woodColor }}
                        />
                      )}
                      <span>{label}</span>
                      {v.priceDelta !== 0 && (
                        <span className={`ml-1 text-[10px] opacity-75 ${isSelected ? "text-ivory" : "text-bronze"}`}>
                          ({v.priceDelta > 0 ? "+" : "−"}&#8377;
                          {formatInr(Math.abs(v.priceDelta))})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <AddToCartButton
          productId={productId}
          variantId={selected?.id}
          disabled={!inStock}
        />
      </div>
    </div>
  );
}

function VariantPillRow({
  label,
  variants,
  selectedId,
  onSelect,
  display,
}: {
  label: string;
  variants: VariantOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  display: (v: VariantOption) => string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.25em] text-graphite/50">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              v.id === selectedId
                ? "border-bronze bg-bronze text-ivory"
                : v.stock > 0
                  ? "border-border text-graphite/80 hover:border-bronze/60"
                  : "border-border text-graphite/40 line-through"
            }`}
          >
            {display(v)}
          </button>
        ))}
      </div>
    </div>
  );
}
