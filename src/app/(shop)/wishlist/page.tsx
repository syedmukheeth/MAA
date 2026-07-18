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
    if (!isLoaded) return;
    
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const result = await getProductsByIds(wishlist);
        if (result.error) {
          setError(result.error);
        } else if (result.products) {
          setProducts(result.products as ProductCardData[]);
        }
      } catch (err) {
        setError("Failed to load wishlist products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [wishlist, isLoaded]);

  if (!isLoaded || (loading && products.length === 0)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-bronze" size={32} />
        <p className="text-sm text-graphite/60">Loading your wishlist...</p>
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

      {error && (
        <div className="mt-8 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-brand-red">
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-2xl bg-cream py-20 px-6 text-center border border-linen/30">
          <div className="rounded-full bg-ivory p-4 text-bronze shadow-xs">
            <Heart size={32} />
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
            Start Shopping <ArrowRight size={16} />
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          {loading && (
            <div className="mb-6 flex items-center gap-2 text-xs text-graphite/50">
              <Loader2 className="animate-spin" size={14} />
              <span>Updating list...</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
