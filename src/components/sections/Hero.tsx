"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero({
  headline,
  subtext,
  imageUrl,
  deliveryMessage,
}: {
  headline: string;
  subtext: string;
  imageUrl: string;
  deliveryMessage: string;
}) {
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
          src={imageUrl}
          alt="Luxury living room with handcrafted furniture"
          fill
          priority
          className="object-cover"
        />
        {/* Layered overlay: baseline 35% darkness + smooth top and bottom gradients to secure navbar and button contrast */}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/75" />
      </motion.div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-xs font-semibold uppercase tracking-[0.4em] text-gold drop-shadow-md"
        >
          {deliveryMessage}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-6 font-heading text-5xl leading-[1.15] text-ivory sm:text-6xl lg:text-7xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          {headline.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < headline.split("\n").length - 1 && <br />}
            </span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.75 }}
          className="mt-7 max-w-xl text-base leading-relaxed text-ivory/95 sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] font-medium"
        >
          {subtext}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <Button
            render={<Link href="/products" />}
            size="lg"
            className="rounded-full bg-bronze px-8 text-ivory hover:bg-bronze/90 shadow-md transition-all hover:shadow-lg cursor-pointer"
          >
            Explore Collection
          </Button>
          <Button
            render={<Link href="/custom-studio" />}
            size="lg"
            variant="outline"
            className="rounded-full border-ivory/80 bg-transparent px-8 text-ivory hover:bg-ivory hover:text-charcoal shadow-md transition-all cursor-pointer"
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
