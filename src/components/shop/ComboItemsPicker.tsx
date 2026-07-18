"use client";

import { useState } from "react";
import Image from "next/image";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

export type ComboPickerItem = {
  comboItemId: string;
  productName: string;
  image: string | null;
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

  return (
    <div>
      <div className="space-y-3">
        <p className="text-sm text-charcoal">This combo includes:</p>
        {items.map((item) => (
          <div
            key={item.comboItemId}
            className="flex gap-3 rounded-xl border border-linen/70 bg-white/50 p-3"
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-cream">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-graphite/40">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-charcoal">
                {item.quantity} × {item.productName}
              </p>
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
    </div>
  );
}
