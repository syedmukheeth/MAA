"use client";

import { motion } from "framer-motion";
import { EASE, DUR, STAGGER, VIEWPORT } from "@/lib/motion";

const WORDS = ["Comfort.", "Lifestyle.", "Luxury.", "Craftsmanship.", "Trust."];

export function BrandStatement({
  label,
  headline,
}: {
  label: string;
  headline: string;
}) {
  return (
    <section id="about" className="scroll-mt-header bg-ivory px-6 py-32 lg:px-10">
      <div className="mx-auto max-w-5xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className="text-xs uppercase tracking-[0.35em] text-bronze"
        >
          {label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.hero, ease: EASE.out, delay: 0.1 }}
          className="mt-8 font-heading text-3xl leading-snug text-charcoal sm:text-4xl lg:text-5xl"
        >
          {headline}
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{ show: { transition: { staggerChildren: STAGGER.tight, delayChildren: 0.25 } } }}
          className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-6"
        >
          {WORDS.map((word) => (
            <motion.span
              key={word}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="font-heading text-xl text-graphite/70 transition-colors duration-300 hover:text-bronze sm:text-2xl"
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
