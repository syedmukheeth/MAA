"use client";

import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

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

export function VariantPicker({
  productId,
  basePrice,
  variants,
}: {
  productId: string;
  basePrice: number;
  variants: VariantOption[];
}) {
  const [selectedId, setSelectedId] = useState<string>(
    variants.find((v) => v.isDefault && v.stock > 0)?.id ??
      variants.find((v) => v.stock > 0)?.id ??
      variants[0]?.id
  );
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
  const inStock = (selected?.stock ?? 0) > 0;
  const lowStock =
    inStock && (selected?.stock ?? 0) <= (selected?.lowStockThreshold ?? 0);

  // Group variants as selectable rows when attributes exist; otherwise pills by name
  const usePills = activeAttrs.length === 0;

  return (
    <div>
      <p className="text-2xl text-charcoal">&#8377;{formatInr(price)}</p>

      <p className="mt-2 text-sm">
        {!inStock ? (
          <span className="text-brand-red">Out of stock</span>
        ) : lowStock ? (
          <span className="text-amber-600">Only {selected.stock} left</span>
        ) : (
          <span className="text-graphite/60">In stock</span>
        )}
      </p>

      {variants.length > 1 && (
        <div className="mt-6 space-y-4">
          {usePills ? (
            <VariantPillRow
              label="Option"
              variants={variants}
              selectedId={selectedId}
              onSelect={setSelectedId}
              display={(v) => v.name}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-graphite/50">
                {activeAttrs.map((a) => a.label).join(" / ")}
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const label =
                    activeAttrs
                      .map((a) => v[a.key as AttrKey])
                      .filter(Boolean)
                      .join(" · ") || v.name;
                  const isSelected = v.id === selectedId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedId(v.id)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        isSelected
                          ? "border-bronze bg-bronze text-ivory"
                          : v.stock > 0
                            ? "border-border text-graphite/80 hover:border-bronze/60"
                            : "border-border text-graphite/40 line-through"
                      }`}
                    >
                      {label}
                      {v.priceDelta !== 0 && (
                        <span className="ml-1 opacity-70">
                          {v.priceDelta > 0 ? "+" : "−"}&#8377;
                          {formatInr(Math.abs(v.priceDelta))}
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
