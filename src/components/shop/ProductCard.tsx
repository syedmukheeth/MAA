"use client";

import Link from "next/link";
import { SafeImage } from "@/components/shop/SafeImage";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import { isInStock } from "@/lib/products";
import { PriceBlock } from "@/components/shop/PriceBlock";
import { useWishlist } from "@/hooks/use-wishlist";
import { Heart, Star } from "lucide-react";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: string;
  mrp?: string | null;
  category: keyof typeof CATEGORY_LABELS;
  images: string[];
  stockQuantity: number;
  lowStockThreshold: number;
  featured?: boolean;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const { toggleWishlist, hasItem, isLoaded } = useWishlist();
  const inStock = isInStock(product);
  const image = product.images[0];
  const wishlisted = isLoaded && hasItem(product.id);

  return (
    <div className="group relative block">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream border border-linen/60 transition-colors duration-300 group-hover:border-bronze/30">
        {image ? (
          <>
            <SafeImage
              src={image}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-104"
            />
            {product.images[1] && (
              <SafeImage
                src={product.images[1]}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover absolute inset-0 opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-graphite/40">
            No image
          </div>
        )}
        {/* Best seller badge */}
        {product.featured && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-bronze px-2.5 py-1 text-[10px] font-semibold text-ivory shadow-sm z-10">
            <Star size={10} className="fill-ivory" />
            Best Seller
          </span>
        )}
        {!inStock && !product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-charcoal/80 px-3 py-1 text-xs text-ivory">
            Out of stock
          </span>
        )}
        {!inStock && product.featured && (
          <span className="absolute left-3 top-12 rounded-full bg-charcoal/80 px-3 py-1 text-xs text-ivory">
            Out of stock
          </span>
        )}
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-semibold text-bronze">
        {CATEGORY_LABELS[product.category]}
      </p>
      <h3 className="mt-1 font-heading text-base text-charcoal group-hover:text-bronze transition-colors duration-300">
        {product.name}
      </h3>
      <div className="mt-1">
        <PriceBlock price={product.price} mrp={product.mrp} size="sm" />
      </div>
    </Link>
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute right-3 top-3 z-10 rounded-full bg-ivory/90 p-2 text-charcoal transition-colors hover:text-brand-red shadow-xs"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product.id);
      }}
    >
      <Heart
        size={16}
        className={wishlisted ? "fill-brand-red text-brand-red" : ""}
      />
    </button>
  </div>
  );
}
