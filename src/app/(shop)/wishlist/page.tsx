"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/hooks/use-wishlist";
import { getProductsByIds } from "@/actions/products";
import { ProductCard, type ProductCardData } from "@/components/shop/ProductCard";
import { Heart, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { wishlist, isLoaded } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The empty case is derived below rather than written into state here —
    // a synchronous setState in an effect body costs an extra render pass.
    if (!isLoaded || wishlist.length === 0) return;

    let cancelled = false;
    getProductsByIds(wishlist)
      .then((result) => {
        if (cancelled) return;
        if (result.error) {
          setError(result.error);
        } else if (result.products) {
          setError(null);
          setProducts(result.products as ProductCardData[]);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load wishlist products.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [wishlist, isLoaded]);

  // An empty wishlist has nothing to fetch, so it is never "loading".
  const visibleProducts = wishlist.length === 0 ? [] : products;
  const isLoading = !isLoaded || (wishlist.length > 0 && loading);

  if (isLoading && visibleProducts.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 aria-hidden="true" className="animate-spin text-bronze" size={32} />
        <p className="text-sm text-graphite/60">Loading your wishlist…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-bronze">
          Your Favorites
        </span>
        <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
          Wishlist
        </h1>
      </div>

      <div aria-live="polite">
        {error && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-brand-red"
          >
            {error}
          </div>
        )}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl bg-cream py-20 px-6 text-center border border-linen/30">
          <div className="rounded-full bg-ivory p-4 text-bronze shadow-xs">
            <Heart aria-hidden="true" size={32} />
          </div>
          <h2 className="mt-6 font-heading text-xl text-charcoal">
            Your wishlist is empty
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-graphite/70">
            Explore our collection of handcrafted furniture to find pieces you love and save them here.
          </p>
          <Button
            render={<Link href="/products" />}
            className="mt-8 rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center gap-1.5"
          >
            Start Shopping <ArrowRight aria-hidden="true" size={16} />
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          {isLoading && (
            <div
              aria-live="polite"
              className="mb-6 flex items-center gap-2 text-xs text-graphite/50"
            >
              <Loader2 aria-hidden="true" className="animate-spin" size={14} />
              <span>Updating list…</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
