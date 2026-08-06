"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Hammer, Home, Star } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { EASE, DUR, STAGGER, VIEWPORT } from "@/lib/motion";

const REASONS = [
  {
    icon: Hammer,
    title: "Expert Craftsmen",
    desc: "Every piece passes through hands with decades of experience.",
  },
  {
    icon: ShieldCheck,
    title: "Genuine Materials",
    desc: "No composite shortcuts. Solid wood, real leather, honest fabric.",
  },
  {
    icon: Home,
    title: "Built For Your Space",
    desc: "Custom dimensions available on nearly every piece we make.",
  },
  {
    icon: Star,
    title: "5-Year Warranty",
    desc: "We stand behind our joinery and finish, in writing.",
  },
];

export function TrustBuilders({
  yearsExperience,
  projectsDelivered,
  happyFamilies,
  googleRating,
}: {
  yearsExperience: number;
  projectsDelivered: number;
  happyFamilies: number;
  googleRating: string;
}) {
  const stats = [
    { label: "Years of Experience", value: yearsExperience, suffix: "+" },
    { label: "Projects Delivered", value: projectsDelivered, suffix: "+" },
    { label: "Happy Families", value: happyFamilies, suffix: "+" },
  ];

  return (
    <section className="bg-charcoal px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{ show: { transition: { staggerChildren: STAGGER.base } } }}
          className="mb-12 grid grid-cols-2 gap-8 border-b border-ivory/10 pb-10 sm:mb-16 sm:pb-14 lg:mb-20 lg:grid-cols-4 lg:pb-16"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="text-center lg:text-left"
            >
              <p className="font-heading text-4xl text-bronze sm:text-5xl">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm text-ivory/60">{s.label}</p>
            </motion.div>
          ))}
          {/* Rating is text, not a count — animating "4.9/5" numerically makes no sense. */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            className="text-center lg:text-left"
          >
            <p className="font-heading text-4xl text-bronze sm:text-5xl">{googleRating}</p>
            <p className="mt-2 text-sm text-ivory/60">Google Rating</p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className="mb-16 max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Why Choose Us
          </p>
          <h2 className="mt-5 font-heading text-3xl text-ivory sm:text-4xl">
            Trust, built into every joint.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{ show: { transition: { staggerChildren: STAGGER.base } } }}
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {REASONS.map((r) => (
            <motion.div
              key={r.title}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="group"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-ivory/5 text-bronze transition-all duration-500 ease-brand group-hover:scale-110 group-hover:bg-bronze group-hover:text-ivory">
                <r.icon size={22} />
              </span>
              <h3 className="mt-5 font-heading text-lg text-ivory">
                {r.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/60">
                {r.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
