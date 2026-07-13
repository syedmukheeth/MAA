"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Heart } from "lucide-react";

const PRODUCTS = [
  {
    name: "Oakridge Lounge Chair",
    room: "Living Room",
    price: "₹42,000",
    image:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Walnut Platform Bed",
    room: "Bedroom",
    price: "₹78,500",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Sheesham Dining Table",
    room: "Dining",
    price: "₹65,000",
    image:
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Heritage Bookshelf",
    room: "Office",
    price: "₹38,900",
    image:
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=1200&auto=format&fit=crop",
  },
];

export function BestSellers() {
  return (
    <section className="bg-ivory px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bronze">
              Best Sellers
            </p>
            <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
              Loved in homes across the country.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <button
                  aria-label="Add to wishlist"
                  className="absolute right-3 top-3 rounded-full bg-ivory/90 p-2 text-charcoal transition-colors hover:text-brand-red"
                >
                  <Heart size={16} />
                </button>
              </div>
              <p className="mt-4 text-xs uppercase tracking-wider text-bronze">
                {p.room}
              </p>
              <h3 className="mt-1 font-heading text-lg text-charcoal">
                {p.name}
              </h3>
              <p className="mt-1 text-sm text-graphite/70">{p.price}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
