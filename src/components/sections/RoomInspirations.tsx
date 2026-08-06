"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { EASE, DUR, STAGGER, VIEWPORT } from "@/lib/motion";

const ROOMS = [
  {
    name: "Modern Living Room",
    image:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Minimal Bedroom",
    image:
      "https://images.unsplash.com/photo-1616627561950-9f746e330187?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Luxury Dining",
    image:
      "https://images.unsplash.com/photo-1617104551722-3b2d51366400?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Workspace",
    image:
      "https://images.unsplash.com/photo-1593062096033-9a26b09da705?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Outdoor Collection",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop",
  },
];

export function RoomInspirations() {
  return (
    <section id="room-inspirations" className="scroll-mt-header bg-cream px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className="mb-16 max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Room Inspirations
          </p>
          <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
            See it, before you build it.
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          variants={{ show: { transition: { staggerChildren: STAGGER.tight } } }}
          className="flex cursor-grab gap-5 overflow-x-auto pb-4 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ROOMS.map((r) => (
            <motion.a
              href="#"
              key={r.name}
              variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0 } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="group relative aspect-[3/4] w-64 flex-none overflow-hidden rounded-xl shadow-lift transition-shadow duration-500 ease-brand hover:shadow-float sm:w-72"
            >
              <Image
                src={r.image}
                alt={r.name}
                fill
                sizes="(min-width: 640px) 288px, 256px"
                className="object-cover transition-transform duration-700 ease-brand group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/10 to-transparent transition-opacity duration-500 group-hover:from-espresso/95" />
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
                <h3 className="font-heading text-lg text-ivory">
                  {r.name}
                </h3>
                <ArrowUpRight
                  size={18}
                  className="translate-y-1 text-ivory/0 transition-all duration-500 ease-brand group-hover:translate-y-0 group-hover:text-ivory"
                />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
