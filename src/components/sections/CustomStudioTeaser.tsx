"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CustomStudioTeaser() {
  return (
    <section className="bg-charcoal px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
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
            className="mt-8 rounded-full bg-bronze px-8 text-ivory hover:bg-bronze/90"
          >
            Start Your Design
            <ArrowRight className="ml-2" size={16} />
          </Button>
        </motion.div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop"
            alt="Custom furniture design consultation"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
