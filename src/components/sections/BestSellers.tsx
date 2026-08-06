"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";

import { useWishlist } from "@/hooks/use-wishlist";
import Link from "next/link";
import { PriceBlock } from "@/components/shop/PriceBlock";
import { EASE, DUR, STAGGER, VIEWPORT } from "@/lib/motion";

const CATEGORIES: Record<string, string> = {
  LIVING_ROOM: "Living Room",
  BEDROOM: "Bedroom",
  DINING: "Dining",
  OFFICE: "Office",
  OUTDOOR: "Outdoor",
};

export type BestSellerProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: string | number;
  mrp?: string | number | null;
  images: string[];
};

export function BestSellers({ products }: { products: BestSellerProduct[] }) {
  const { toggleWishlist, hasItem, isLoaded } = useWishlist();

  if (!products || products.length === 0) return null;

  return (
    <section className="bg-ivory px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className="mb-16 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bronze">
              Best Sellers
            </p>
            <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
              Loved in homes across the country.
            </h2>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{ show: { transition: { staggerChildren: STAGGER.tight } } }}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {products.map((p) => {
            const wishlisted = isLoaded && hasItem(p.id);
            return (
              <motion.div
                key={p.id}
                variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: DUR.base, ease: EASE.out }}
                className="group"
              >
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream shadow-lift transition-shadow duration-500 ease-brand group-hover:shadow-float">
                    <Image
                      src={p.images[0] || "/brand/logo.jpeg"}
                      alt={p.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-brand group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <button
                      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      className="absolute right-3 top-3 rounded-full bg-ivory/90 p-2 text-charcoal shadow-lift transition-all duration-300 ease-brand hover:scale-110 hover:text-brand-red"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(p.id);
                      }}
                    >
                      <Heart
                        size={16}
                        className={wishlisted ? "fill-brand-red text-brand-red" : ""}
                      />
                    </button>
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-wider text-bronze">
                    {CATEGORIES[p.category] || p.category}
                  </p>
                  <h3 className="mt-1 font-heading text-lg text-charcoal transition-colors duration-300 group-hover:text-bronze">
                    {p.name}
                  </h3>
                  <div className="mt-1">
                    <PriceBlock price={p.price} mrp={p.mrp} size="sm" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
