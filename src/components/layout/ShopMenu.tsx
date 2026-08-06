"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BedDouble,
  Briefcase,
  ChevronDown,
  Sofa,
  Trees,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import type { RoomCategory } from "@/lib/shop-sections";
import { DUR, EASE, STAGGER } from "@/lib/motion";

const CATEGORY_ICONS: Record<RoomCategory, LucideIcon> = {
  LIVING_ROOM: Sofa,
  BEDROOM: BedDouble,
  DINING: UtensilsCrossed,
  OFFICE: Briefcase,
  OUTDOOR: Trees,
};

const CATEGORY_BLURBS: Record<RoomCategory, string> = {
  LIVING_ROOM: "Sofas, coffee tables, TV units",
  BEDROOM: "Beds, wardrobes, side tables",
  DINING: "Dining sets, sideboards, bar stools",
  OFFICE: "Desks, chairs, shelving",
  OUTDOOR: "Patio seating, swings, planters",
};

const SECONDARY = [
  { label: "All Products", href: "/products", note: "The full catalogue" },
  { label: "Best Sellers", href: "/products?sort=best_sellers", note: "What Kurnool keeps buying" },
  { label: "Combo Offers", href: "/combos", note: "Rooms priced as a set" },
  { label: "Custom Studio", href: "/custom-studio", note: "Built to your dimensions" },
];

/**
 * The Shop mega-menu.
 *
 * Open state lives in Navbar, not here, because an open panel must also force
 * the header out of its transparent-over-hero state — ivory glass behind the
 * panel, not the hero photo.
 *
 * Categories come from the same parseEnabledCategories() the /products page
 * uses, so a category hidden in /admin/settings cannot still be advertised here.
 */
export function ShopMenu({
  categories,
  featuredImageUrl,
  solid,
  open,
  onOpen,
  onClose,
  active,
}: {
  categories: RoomCategory[];
  featuredImageUrl: string;
  solid: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  active: boolean;
}) {
  return (
    // Hover intent on the wrapper rather than the button: the pointer has to
    // cross the gap between trigger and panel, and a button-only handler closes
    // it mid-travel.
    <li
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onClose();
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => (open ? onClose() : onOpen())}
        className={`flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-eyebrow transition-colors duration-300 hover:text-bronze ${
          active || open ? "text-bronze" : solid ? "text-graphite" : "text-ivory/90"
        }`}
      >
        Shop
        <ChevronDown
          size={12}
          className={`transition-transform duration-300 ease-brand ${open ? "rotate-180" : ""}`}
        />
        {active && (
          <motion.span
            layoutId="nav-underline"
            className="absolute -bottom-2 left-0 right-0 h-px bg-bronze"
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            // Anchored to the header, not the trigger: a full-bleed panel reads
            // as part of the chrome, a trigger-anchored dropdown reads as a form
            // control.
            className="fixed inset-x-0 top-header border-y border-hairline bg-ivory/95 shadow-float backdrop-blur-xl"
          >
            <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr_0.7fr] lg:px-10">
              <div>
                <p className="text-[0.65rem] font-medium uppercase tracking-eyebrow text-bronze">
                  Shop by room
                </p>
                <ul className="mt-5 grid gap-1 sm:grid-cols-2">
                  {categories.map((key, i) => {
                    const Icon = CATEGORY_ICONS[key];
                    return (
                      <motion.li
                        key={key}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + i * STAGGER.tight, duration: DUR.fast }}
                      >
                        <Link
                          href={`/products?category=${key}`}
                          onClick={onClose}
                          className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-300 hover:bg-cream"
                        >
                          <Icon
                            size={17}
                            className="mt-0.5 shrink-0 text-bronze transition-transform duration-500 ease-brand group-hover:-translate-y-0.5"
                          />
                          <span>
                            <span className="block font-heading text-lg leading-tight text-charcoal">
                              {CATEGORY_LABELS[key]}
                            </span>
                            <span className="mt-0.5 block text-xs text-graphite/70">
                              {CATEGORY_BLURBS[key]}
                            </span>
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <p className="text-[0.65rem] font-medium uppercase tracking-eyebrow text-bronze">
                  Ways to buy
                </p>
                <ul className="mt-5 space-y-1">
                  {SECONDARY.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="group flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors duration-300 hover:bg-cream"
                      >
                        <span>
                          <span className="block text-sm font-medium text-charcoal">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-graphite/70">{item.note}</span>
                        </span>
                        <ArrowUpRight
                          size={14}
                          className="shrink-0 text-graphite/35 transition-all duration-500 ease-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-bronze"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/custom-studio"
                onClick={onClose}
                className="group relative hidden overflow-hidden rounded-2xl lg:block"
              >
                <Image
                  src={featuredImageUrl}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover transition-transform duration-[1.2s] ease-brand group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/25 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-5">
                  <span className="block text-[0.6rem] font-medium uppercase tracking-eyebrow text-gold">
                    Custom Studio
                  </span>
                  <span className="mt-1.5 block font-heading text-xl leading-tight text-ivory">
                    Made to your room, not ours
                  </span>
                </span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
