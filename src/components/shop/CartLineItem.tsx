"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { updateCartItemQuantity, removeFromCart } from "@/actions/cart";

export type CartLineItemData = {
  id: string;
  name: string;
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
    if (next < 0) return;
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

  return (
    <div className="flex items-center gap-4 border-b border-border py-5">
      <div className="relative size-20 flex-none overflow-hidden rounded-lg bg-cream">
        {item.image && (
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-heading text-base text-charcoal">
          {item.name}
          {item.isCombo && (
            <span className="ml-2 rounded-full bg-bronze/15 px-2 py-0.5 text-xs text-bronze">
              Combo
            </span>
          )}
        </p>
        <p className="mt-1 text-sm text-graphite/60">&#8377;{item.unitPrice}</p>
        {error && <p className="mt-1 text-xs text-brand-red">{error}</p>}
      </div>
      <div className="flex items-center rounded-full border border-border">
        <button
          disabled={isPending}
          className="px-3 py-1.5 text-graphite/70"
          onClick={() => changeQuantity(quantity - 1)}
        >
          -
        </button>
        <span className="w-8 text-center text-sm">{quantity}</span>
        <button
          disabled={isPending}
          className="px-3 py-1.5 text-graphite/70"
          onClick={() => changeQuantity(quantity + 1)}
        >
          +
        </button>
      </div>
      <button
        disabled={isPending}
        onClick={remove}
        className="p-2 text-graphite/50 hover:text-brand-red"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
