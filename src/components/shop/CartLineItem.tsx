"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { SafeImage } from "./SafeImage";
import { Trash2, Loader2 } from "lucide-react";
import { updateCartItemQuantity, removeFromCart } from "@/actions/cart";
import { formatINR } from "@/lib/format";

const MAX_QUANTITY = 99;

export type CartLineItemData = {
  id: string;
  name: string;
  slug?: string | null;
  comboSlug?: string | null;
  variantLabel?: string | null;
  image: string | null;
  unitPrice: string;
  quantity: number;
  isCombo: boolean;
};

export function CartLineItem({ item }: { item: CartLineItemData }) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeQuantity(next: number) {
    // Never delete via the minus button; the trash icon is the delete action
    if (next < 1 || next > MAX_QUANTITY) return;
    setQuantity(next);
    setError(null);
    startTransition(async () => {
      const result = await updateCartItemQuantity(item.id, next);
      if (result?.error) {
        setError(result.error);
        setQuantity(item.quantity);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      await removeFromCart(item.id);
    });
  }

  const productHref = item.isCombo
    ? (item.comboSlug ? `/combos/${item.comboSlug}` : null)
    : (item.slug ? `/products/${item.slug}` : null);

  const imageAndName = (
    <>
      <div className="relative size-20 flex-none overflow-hidden rounded-lg bg-cream">
        {item.image && (
          <SafeImage src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-base text-charcoal break-words">
          {item.name}
          {item.isCombo && (
            <span className="ml-2 rounded-full bg-bronze/15 px-2 py-0.5 text-xs text-bronze">
              Combo
            </span>
          )}
        </p>
        {item.variantLabel && (
          <p className="mt-0.5 text-xs text-graphite/50 break-words">{item.variantLabel}</p>
        )}
        <p className="mt-1 text-sm text-graphite/60 tabular-nums">
          {formatINR(item.unitPrice)}
          <span className="text-graphite/40"> each</span>
        </p>
        <p className="mt-0.5 text-sm font-medium text-charcoal tabular-nums">
          {formatINR(Number(item.unitPrice) * quantity)}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-brand-red">
            {error}
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="flex items-center gap-4 border-b border-border py-5">
      {productHref ? (
        <Link
          href={productHref}
          className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity"
        >
          {imageAndName}
        </Link>
      ) : (
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {imageAndName}
        </div>
      )}
      <div className="flex shrink-0 items-center rounded-full border border-border touch-manipulation focus-within:ring-2 focus-within:ring-bronze/40">
        <button
          type="button"
          aria-label={`Decrease quantity of ${item.name}`}
          disabled={isPending || quantity <= 1}
          className="px-3 py-1.5 text-graphite/70 transition-colors hover:text-charcoal disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          onClick={() => changeQuantity(quantity - 1)}
        >
          −
        </button>
        {isPending ? (
          <span className="flex w-8 items-center justify-center text-graphite/40">
            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
            <span className="sr-only">Updating quantity…</span>
          </span>
        ) : (
          <span aria-live="polite" className="w-8 text-center text-sm tabular-nums">
            {quantity}
          </span>
        )}
        <button
          type="button"
          aria-label={`Increase quantity of ${item.name}`}
          disabled={isPending || quantity >= MAX_QUANTITY}
          className="px-3 py-1.5 text-graphite/70 transition-colors hover:text-charcoal disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          onClick={() => changeQuantity(quantity + 1)}
        >
          +
        </button>
      </div>
      <button
        type="button"
        aria-label={`Remove ${item.name} from cart`}
        disabled={isPending}
        onClick={remove}
        className="shrink-0 rounded-full p-2 text-graphite/50 transition-colors hover:text-brand-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:opacity-40"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
