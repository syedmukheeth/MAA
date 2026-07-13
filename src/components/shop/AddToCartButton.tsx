"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/cart";

export function AddToCartButton({
  productId,
  comboId,
  disabled,
}: {
  productId?: string;
  comboId?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      const result = await addToCart({ productId, comboId, quantity });
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/cart");
      }
    } catch {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
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
          className="flex-1 rounded-full bg-bronze text-ivory hover:bg-bronze/90"
        >
          <ShoppingCart className="mr-2" size={16} />
          {pending ? "Adding..." : "Add to Cart"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-brand-red">{error}</p>}
    </div>
  );
}
