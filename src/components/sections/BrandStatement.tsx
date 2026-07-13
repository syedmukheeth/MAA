"use client";

import { motion } from "framer-motion";

const WORDS = ["Comfort.", "Lifestyle.", "Luxury.", "Craftsmanship.", "Trust."];

export function BrandStatement() {
  return (
    <section className="bg-ivory px-6 py-32 lg:px-10">
      <div className="mx-auto max-w-5xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7 }}
          className="text-xs uppercase tracking-[0.35em] text-bronze"
        >
          Crafted For Better Living
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-8 font-heading text-3xl leading-snug text-charcoal sm:text-4xl lg:text-5xl"
        >
          We don&apos;t build furniture. We shape the way you live, gather,
          and grow, one room at a time.
        </motion.h2>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
              className="font-heading text-xl text-graphite/70 sm:text-2xl"
            >
              {word}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
