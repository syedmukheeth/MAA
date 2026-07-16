"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";

export type TestimonialData = {
  id: string;
  name: string;
  location: string | null;
  quote: string;
  rating: number;
  imageUrl: string | null;
};

export function Testimonials({ testimonials }: { testimonials: TestimonialData[] }) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="bg-ivory px-6 py-28 lg:px-10">
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
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="overflow-hidden rounded-2xl bg-cream flex flex-col h-full"
            >
              {t.imageUrl && (
                <div className="relative aspect-[16/10] w-full flex-none">
                  <Image src={t.imageUrl} alt={t.name} fill className="object-cover" />
                </div>
              )}
              <div className="p-7 flex flex-col flex-1">
                <div className="flex gap-1 text-bronze flex-none">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      size={14}
                      fill={s < t.rating ? "currentColor" : "none"}
                      className={s < t.rating ? "text-bronze" : "text-graphite/20"}
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-graphite/80 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-5 font-heading text-base text-charcoal flex-none">
                  {t.name}
                </p>
                {t.location && (
                  <p className="text-xs text-graphite/60 flex-none">{t.location}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
