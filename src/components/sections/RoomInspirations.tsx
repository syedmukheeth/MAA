"use client";

import { motion } from "framer-motion";
import Image from "next/image";

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
    <section id="room-inspirations" className="bg-cream px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Room Inspirations
          </p>
          <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
            See it, before you build it.
          </h2>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ROOMS.map((r, i) => (
            <motion.a
              href="#"
              key={r.name}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="group relative aspect-[3/4] w-64 flex-none overflow-hidden rounded-xl sm:w-72"
            >
              <Image
                src={r.image}
                alt={r.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-transparent to-transparent" />
              <h3 className="absolute bottom-5 left-5 font-heading text-lg text-ivory">
                {r.name}
              </h3>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
