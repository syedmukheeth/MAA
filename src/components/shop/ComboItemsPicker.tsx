"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { SafeImage } from "./SafeImage";
import { ComboProductInspector } from "./ComboProductInspector";

export type ComboPickerItem = {
  productId: string;
  comboItemId: string;
  productName: string;
  description: string;
  materials: string[];
  dimensions: string | null;
  image: string | null;
  images: string[];
  quantity: number;
  options: { variantId: string; label: string; inStock: boolean }[];
};

/**
 * Lists every product inside the combo. Items the manager gave options get a
 * selector; fixed items say so explicitly instead of showing nothing.
 */
export function ComboItemsPicker({
  comboId,
  items,
  disabled,
}: {
  comboId: string;
  items: ComboPickerItem[];
  disabled?: boolean;
}) {
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      items
        .filter((i) => i.options.length > 0)
        .map((i) => [
          i.comboItemId,
          (i.options.find((o) => o.inStock) ?? i.options[0]).variantId,
        ])
    )
  );

  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");

  const inspectorProducts = items.map((i) => ({
    id: i.productId,
    name: i.productName,
    description: i.description,
    price: "",
    materials: i.materials,
    dimensions: i.dimensions,
    images: i.images,
  }));

  const handleOpenInspector = (productId: string) => {
    setSelectedProductId(productId);
    setInspectorOpen(true);
  };

  return (
    <div>
      <div className="space-y-3">
        <p className="text-sm text-charcoal font-semibold uppercase tracking-wider text-graphite/40">
          This combo includes:
        </p>
        {items.map((item) => (
          <div
            key={item.comboItemId}
            className="flex gap-3 rounded-xl border border-linen/70 bg-white/50 p-3 hover:border-bronze/35 transition-colors duration-300"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-cream">
              {item.image ? (
                <button
                  type="button"
                  onClick={() => handleOpenInspector(item.productId)}
                  aria-label={`Inspect ${item.productName}`}
                  className="group relative block size-full cursor-zoom-in overflow-hidden"
                >
                  <SafeImage
                    src={item.image}
                    alt={item.productName}
                    fill
                    sizes="64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-graphite/40">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => handleOpenInspector(item.productId)}
                className="text-left font-medium text-sm text-charcoal hover:text-bronze transition-colors focus:outline-none"
              >
                {item.quantity} × {item.productName}
              </button>
              {item.options.length > 0 ? (
                <label className="mt-1.5 block text-xs text-graphite/60">
                  Choose an option
                  <select
                    value={selections[item.comboItemId] ?? ""}
                    onChange={(e) =>
                      setSelections((prev) => ({
                        ...prev,
                        [item.comboItemId]: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-charcoal outline-none focus:border-bronze"
                  >
                    {item.options.map((o) => (
                      <option
                        key={o.variantId}
                        value={o.variantId}
                        disabled={!o.inStock}
                      >
                        {o.label}
                        {!o.inStock ? " (out of stock)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-1.5 text-xs text-graphite/50">
                  No other options available for this product.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <AddToCartButton
          comboId={comboId}
          comboSelections={Object.entries(selections).map(
            ([comboItemId, variantId]) => ({ comboItemId, variantId })
          )}
          disabled={disabled}
        />
      </div>

      <ComboProductInspector
        products={inspectorProducts}
        open={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        initialProductId={selectedProductId}
      />
    </div>
  );
}
