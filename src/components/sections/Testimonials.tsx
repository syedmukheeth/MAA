"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Priya & Arjun Rao",
    location: "Hyderabad",
    quote:
      "MAA Furnitures redid our entire living room. It doesn't feel like furniture we bought. It feels like it was always meant to be there.",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Kavya Reddy",
    location: "Bengaluru",
    quote:
      "The custom dining table took our vague Pinterest board and turned it into the centerpiece of our home. Every guest asks where it's from.",
    image:
      "https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Rahul & Sneha Menon",
    location: "Chennai",
    quote:
      "Craftsmanship you can actually feel in the joinery. Three years in and it still looks brand new.",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop",
  },
];

export function Testimonials() {
  return (
    <section className="bg-ivory px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Customer Stories
          </p>
          <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
            Real homes, real families.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="overflow-hidden rounded-2xl bg-cream"
            >
              <div className="relative aspect-[16/10]">
                <Image src={t.image} alt={t.name} fill className="object-cover" />
              </div>
              <div className="p-7">
                <div className="flex gap-1 text-bronze">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-graphite/80">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-5 font-heading text-base text-charcoal">
                  {t.name}
                </p>
                <p className="text-xs text-graphite/60">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
