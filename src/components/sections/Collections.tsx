"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const COLLECTIONS = [
  {
    name: "Living Room",
    tagline: "Gather. Unwind. Belong.",
    category: "LIVING_ROOM",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Bedroom",
    tagline: "Rest that feels earned.",
    category: "BEDROOM",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Dining",
    tagline: "Every meal, a moment.",
    category: "DINING",
    image:
      "https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Office",
    tagline: "Focus, in comfort.",
    category: "OFFICE",
    image:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1600&auto=format&fit=crop",
  },
  {
    name: "Outdoor",
    tagline: "Bring the living room out.",
    category: "OUTDOOR",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
  },
];

export function Collections({
  categoryCounts = {},
}: {
  categoryCounts?: Record<string, number>;
}) {
  return (
    <section id="collections" className="bg-cream px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bronze">
              Featured Collections
            </p>
            <h2 className="mt-5 max-w-xl font-heading text-3xl text-charcoal sm:text-4xl">
              Every room, its own story.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-graphite/70">
            Furniture grouped by the room it belongs in, not by category.
            Each collection is styled inside real homes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {COLLECTIONS.map((c, i) => {
            const count = categoryCounts[c.category] ?? 0;
            return (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: (i % 2) * 0.1 }}
                className={`group relative overflow-hidden rounded-2xl ${
                  i === 0 ? "md:col-span-2 md:row-span-1 aspect-[16/9]" : "aspect-[4/5]"
                }`}
              >
                <Link href={`/products?category=${c.category}`} className="block h-full w-full">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-7">
                    <div>
                      <h3 className="font-heading text-2xl text-ivory">
                        {c.name}
                      </h3>
                      <p className="mt-1 text-sm text-ivory/75">
                        {c.tagline} · {count} {count === 1 ? "product" : "products"}
                      </p>
                    </div>
                    <span className="rounded-full border border-ivory/40 p-2.5 text-ivory transition-colors group-hover:border-bronze group-hover:text-bronze">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
