"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { EASE, DUR, STAGGER, VIEWPORT } from "@/lib/motion";

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
    <section
      id="testimonials"
      className="scroll-mt-header bg-ivory px-6 py-28 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className="mb-16 max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
             Customer Stories
          </p>
          <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
            Real homes, real families.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{ show: { transition: { staggerChildren: STAGGER.base } } }}
          className="grid grid-cols-1 gap-8 lg:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.id}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              whileHover={{ y: -6 }}
              className="flex h-full flex-col overflow-hidden rounded-2xl bg-cream shadow-lift transition-shadow duration-500 ease-brand hover:shadow-float"
            >
              {t.imageUrl && (
                <div className="relative aspect-[16/10] w-full flex-none overflow-hidden">
                  <Image src={t.imageUrl} alt={t.name} fill className="object-cover" />
                </div>
              )}
              <div className="relative flex flex-1 flex-col p-7">
                <Quote
                  size={40}
                  className="absolute right-5 top-5 text-bronze/10"
                  aria-hidden
                />
                <div className="flex flex-none gap-1 text-bronze">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      size={14}
                      fill={s < t.rating ? "currentColor" : "none"}
                      className={s < t.rating ? "text-bronze" : "text-graphite/20"}
                    />
                  ))}
                </div>
                <p className="relative mt-4 flex-1 text-sm leading-relaxed text-graphite/80">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-5 flex-none font-heading text-base text-charcoal">
                  {t.name}
                </p>
                {t.location && (
                  <p className="flex-none text-xs text-graphite/60">{t.location}</p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
