"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE, DUR, VIEWPORT } from "@/lib/motion";

export function CustomStudioTeaser() {
  return (
    <section className="bg-charcoal px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.base, ease: EASE.out }}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Custom Furniture Studio
          </p>
          <h2 className="mt-5 font-heading text-3xl text-ivory sm:text-4xl">
            Design Your Dream Furniture
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-ivory/70">
            Send us a photo, a Pinterest board, or just a description. Our
            design team turns it into furniture built exactly for your space.
          </p>
          <Button
            render={<Link href="/custom-studio" />}
            size="lg"
            className="group mt-8 rounded-full bg-bronze px-8 text-ivory transition-colors duration-500 ease-brand hover:bg-bronze-lit"
          >
            Start Your Design
            <ArrowRight
              className="ml-2 transition-transform duration-500 ease-brand group-hover:translate-x-1"
              size={16}
            />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.hero, ease: EASE.out, delay: 0.1 }}
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-float"
        >
          <Image
            src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop"
            alt="Custom furniture design consultation"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-brand group-hover:scale-105"
          />
        </motion.div>
      </div>
    </section>
  );
}
