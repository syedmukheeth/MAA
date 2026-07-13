"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const MATERIALS = [
  {
    name: "Solid Wood Grain",
    desc: "Teak, sheesham & oak, chosen for grain character.",
    image:
      "https://images.unsplash.com/photo-1615874959474-d609969a20ed?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Fine Fabric",
    desc: "Woven textures selected for durability and touch.",
    image:
      "https://images.unsplash.com/photo-1600166898405-da9535204843?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Full-Grain Leather",
    desc: "Ages beautifully, softens with every year of use.",
    image:
      "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Precision Joinery",
    desc: "Mortise, tenon and dovetail. Hardware only where it belongs.",
    image:
      "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?q=80&w=1200&auto=format&fit=crop",
  },
];

export function Materials() {
  return (
    <section className="bg-ivory px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Materials We Use
          </p>
          <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
            Texture you can feel through the screen.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {MATERIALS.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl"
            >
              <Image
                src={m.image}
                alt={m.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-heading text-lg text-ivory">{m.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ivory/70">
                  {m.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
