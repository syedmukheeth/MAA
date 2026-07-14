"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Hammer, Home, Star } from "lucide-react";

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
    { label: "Years of Experience", value: `${yearsExperience}+` },
    { label: "Projects Delivered", value: `${projectsDelivered.toLocaleString("en-IN")}+` },
    { label: "Happy Families", value: `${happyFamilies.toLocaleString("en-IN")}+` },
    { label: "Google Rating", value: googleRating },
  ];

  return (
    <section className="bg-charcoal px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 grid grid-cols-2 gap-8 border-b border-ivory/10 pb-16 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center lg:text-left"
            >
              <p className="font-heading text-4xl text-bronze sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-ivory/60">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Why Choose Us
          </p>
          <h2 className="mt-5 font-heading text-3xl text-ivory sm:text-4xl">
            Trust, built into every joint.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-ivory/5 text-bronze">
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
        </div>
      </div>
    </section>
  );
}
