"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/cart";
import { PURCHASES_DISABLED_MESSAGE } from "@/lib/site-settings-constants";
import { usePurchasing } from "@/components/shop/PurchasingProvider";

import { WishlistToggleButton } from "@/components/shop/WishlistToggleButton";

const MAX_QUANTITY = 99;

export function AddToCartButton({
  productId,
  variantId,
  comboId,
  comboSelections,
  disabled,
}: {
  productId?: string;
  variantId?: string;
  comboId?: string;
  comboSelections?: { comboItemId: string; variantId: string }[];
  disabled?: boolean;
}) {
  const { enabled: purchasingEnabled, disabledMessage } = usePurchasing();
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const result = await addToCart({
        productId,
        variantId,
        comboId,
        comboSelections,
        quantity,
      });
      if (result?.requiresAuth) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (result?.error) {
        setError(result.error);
        return;
      }
      // Stay on the page — refresh so the navbar cart count updates,
      // and show inline confirmation instead of redirecting to /cart.
      router.refresh();
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  // Catalogue-only mode: no quantity stepper, no cart button. Wishlist stays,
  // since saving an item you cannot buy yet is the point.
  if (!purchasingEnabled) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-xl border border-linen bg-cream px-4 py-3 text-sm text-graphite/80">
          {disabledMessage ?? PURCHASES_DISABLED_MESSAGE}
        </p>
        {productId && <WishlistToggleButton productId={productId} />}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-border touch-manipulation focus-within:ring-2 focus-within:ring-bronze/40">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            className="px-3 py-2 text-graphite/70 transition-colors hover:text-charcoal disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span aria-live="polite" className="w-8 text-center text-sm tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= MAX_QUANTITY}
            className="px-3 py-2 text-graphite/70 transition-colors hover:text-charcoal disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
          >
            +
          </button>
        </div>
        <Button
          type="button"
          disabled={disabled || pending}
          onClick={onClick}
          className={`flex-1 rounded-full flex items-center justify-center text-ivory ${
            added ? "bg-sage hover:bg-sage/90" : "bg-bronze hover:bg-bronze/90"
          }`}
        >
          {pending ? (
            <Loader2 className="mr-2 animate-spin" size={16} aria-hidden="true" />
          ) : added ? (
            <Check className="mr-2" size={16} aria-hidden="true" />
          ) : (
            <ShoppingCart className="mr-2" size={16} aria-hidden="true" />
          )}
          {pending ? "Adding to Cart…" : added ? "Added to Cart" : "Add to Cart"}
        </Button>
        {productId && <WishlistToggleButton productId={productId} />}
      </div>
      <div aria-live="polite">
        {added && (
          <p className="mt-2 text-sm text-graphite/70">
            Item added.{" "}
            <Link href="/cart" className="font-medium text-bronze hover:underline">
              View cart →
            </Link>
          </p>
        )}
        {error && <p className="mt-2 text-sm text-brand-red">{error}</p>}
      </div>
    </div>
  );
}
