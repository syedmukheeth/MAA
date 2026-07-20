"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/cart";

import { WishlistToggleButton } from "@/components/shop/WishlistToggleButton";

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

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            className="px-3 py-2 text-graphite/70"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            -
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            className="px-3 py-2 text-graphite/70"
            onClick={() => setQuantity((q) => q + 1)}
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
            <Loader2 className="mr-2 animate-spin" size={16} />
          ) : added ? (
            <Check className="mr-2" size={16} />
          ) : (
            <ShoppingCart className="mr-2" size={16} />
          )}
          {pending ? "Adding to Cart..." : added ? "Added to Cart" : "Add to Cart"}
        </Button>
        {productId && <WishlistToggleButton productId={productId} />}
      </div>
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
  );
}
