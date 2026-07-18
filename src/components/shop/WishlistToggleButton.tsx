"use client";

import { useWishlist } from "@/hooks/use-wishlist";
import { Heart } from "lucide-react";

export function WishlistToggleButton({ productId }: { productId: string }) {
  const { toggleWishlist, hasItem, isLoaded } = useWishlist();
  const wishlisted = isLoaded && hasItem(productId);

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      className="inline-flex items-center justify-center rounded-full border border-linen bg-white p-3 text-charcoal hover:border-bronze hover:text-bronze transition-all duration-300 focus:outline-none"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        size={20}
        className={`transition-all duration-300 ${
          wishlisted ? "fill-brand-red text-brand-red scale-110" : "text-charcoal"
        }`}
      />
    </button>
  );
}
