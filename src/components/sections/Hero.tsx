"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex h-screen min-h-[720px] w-full items-center justify-center overflow-hidden"
    >
      <motion.div
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2400&auto=format&fit=crop"
          alt="Luxury living room with handcrafted furniture"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-charcoal/50" />
      </motion.div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xs uppercase tracking-[0.35em] text-bronze"
        >
          Handcrafted &middot; Est. Legacy of Craft
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-6 font-heading text-5xl leading-[1.05] text-ivory sm:text-6xl lg:text-7xl"
        >
          Crafted For Homes.
          <br />
          Built For Generations.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.75 }}
          className="mt-7 max-w-xl text-base leading-relaxed text-ivory/80 sm:text-lg"
        >
          Premium handcrafted furniture designed to bring timeless beauty and
          lasting comfort into every space.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button
            render={<Link href="#collections" />}
            size="lg"
            className="rounded-full bg-ivory px-8 text-charcoal hover:bg-ivory/90"
          >
            Explore Collection
          </Button>
          <Button
            render={<Link href="#custom-studio" />}
            size="lg"
            variant="outline"
            className="rounded-full border-ivory/40 bg-transparent px-8 text-ivory hover:bg-ivory/10"
          >
            Design Custom Furniture
          </Button>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-ivory/70"
      >
        <ChevronDown size={28} />
      </motion.div>
    </section>
  );
}
