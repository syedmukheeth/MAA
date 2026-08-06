"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DUR, EASE_OUT_EXPO, revealMask } from "@/lib/motion";

export function Hero({
  headline,
  subtext,
  imageUrl,
  deliveryMessage,
  yearsExperience,
  projectsDelivered,
}: {
  headline: string;
  subtext: string;
  imageUrl: string;
  deliveryMessage: string;
  yearsExperience: number;
  projectsDelivered: number;
}) {
  const lines = headline.split("\n");

  return (
    // -mt-header cancels the pt-header the (shop) layout applies to <main>. That
    // padding exists so ordinary pages clear the fixed header; the hero is
    // full-bleed and the header is transparent over it, so without this the hero
    // starts 80px down and the header's ivory type sits on the ivory page
    // background, invisible until scroll flips the header to its solid state.
    //
    // h-dvh, not h-screen: on mobile h-screen measures the viewport without the
    // URL bar, so the bottom trust strip lands under the browser chrome.
    <section
      id="top"
      className="relative -mt-header flex h-dvh min-h-[640px] w-full items-center overflow-hidden scroll-mt-header"
    >
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: EASE_OUT_EXPO }}
        className="absolute inset-0"
      >
        <Image
          src={imageUrl}
          alt="Handcrafted living room furniture in a MAA interior"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Three-layer scrim, tuned so the type needs no drop-shadow of its own:
          a warm base, a vertical gradient that anchors the header and the
          bottom strip, and — on desktop only — a left-weighted wash under the
          copy, which sits left of centre from lg up. */}
      <div className="absolute inset-0 bg-espresso/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-espresso/80 via-espresso/10 to-espresso/85" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-espresso/75 via-espresso/20 to-transparent lg:block" />
      <div className="surface-grain" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-header text-center lg:px-10 lg:text-left">
        <div className="max-w-3xl lg:max-w-2xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.slow, delay: 0.2 }}
            className="flex items-center justify-center gap-3.5 lg:justify-start"
          >
            <span className="h-px w-10 bg-gold/70" />
            <p className="text-[0.65rem] font-medium uppercase tracking-eyebrow text-gold">
              {deliveryMessage}
            </p>
          </motion.div>

          <h1 className="mt-7 font-heading text-display-1 leading-[1.02] tracking-display text-ivory">
            {lines.map((line, i) => (
              // Each line clips its own reveal, so the type slides up from
              // behind its baseline rather than fading in place.
              <span key={i} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  variants={revealMask}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  className="block"
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.slow, delay: 0.55, ease: EASE_OUT_EXPO }}
            className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-ivory/85 sm:text-lg lg:mx-0"
          >
            {subtext}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.slow, delay: 0.7, ease: EASE_OUT_EXPO }}
            className="mt-11 flex flex-col items-center gap-6 sm:flex-row sm:justify-center lg:justify-start"
          >
            <Link
              href="/products"
              className="group inline-flex items-center gap-2.5 rounded-full bg-bronze py-4 pl-8 pr-6 text-sm font-medium tracking-wide text-ivory shadow-float transition-colors duration-500 ease-brand hover:bg-bronze-lit"
            >
              Explore the collection
              <ArrowRight
                size={16}
                className="transition-transform duration-500 ease-brand group-hover:translate-x-1"
              />
            </Link>
            {/* A ghost link, not a second outlined box. Two bordered pills on a
                photograph is the stock-template look. */}
            <Link
              href="/custom-studio"
              className="link-underline text-sm font-medium tracking-wide text-ivory/90 transition-colors hover:text-ivory"
            >
              Design custom furniture
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom proof strip. Replaces a bouncing chevron: it still marks the
          fold, and it answers the two questions a first-time visitor has. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.slow, delay: 1, ease: EASE_OUT_EXPO }}
        className="absolute inset-x-0 bottom-0 z-10 border-t border-ivory/15"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-ivory/15 px-6 lg:px-10">
          <Proof value={`${yearsExperience}+ years`} label="Handcrafting in Kurnool" />
          <Proof value={`${projectsDelivered.toLocaleString("en-IN")}+`} label="Homes furnished" />
          <Proof value="Made to order" label="Any size, any timber" />
        </div>
      </motion.div>
    </section>
  );
}

function Proof({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-5 text-center sm:px-4 sm:py-6">
      <p className="font-heading text-lg text-ivory sm:text-xl">{value}</p>
      <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-ivory/60 sm:text-[0.65rem]">
        {label}
      </p>
    </div>
  );
}
