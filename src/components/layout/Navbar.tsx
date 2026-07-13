"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Collections", href: "#collections" },
  { label: "Craftsmanship", href: "#craftsmanship" },
  { label: "Custom Studio", href: "#custom-studio" },
  { label: "Room Inspirations", href: "#room-inspirations" },
  { label: "Showroom", href: "#showroom" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid
          ? "bg-ivory/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="#top" className="flex items-center gap-3">
          <Image
            src="/brand/logo.jpeg"
            alt="MAA Furnitures"
            width={44}
            height={44}
            className="rounded-full"
            priority
          />
          <span
            className={`font-heading text-lg tracking-wide transition-colors ${
              solid ? "text-charcoal" : "text-ivory"
            }`}
          >
            MAA Furnitures
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-sm tracking-wide transition-colors hover:text-bronze ${
                  solid ? "text-graphite" : "text-ivory/90"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Button
            render={<Link href="#custom-studio" />}
            className="rounded-full bg-bronze px-6 text-ivory hover:bg-bronze/90"
          >
            Design Custom Furniture
          </Button>
        </div>

        <button
          className={`lg:hidden ${solid ? "text-charcoal" : "text-ivory"}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-ivory px-6 py-6 lg:hidden">
          <ul className="flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base text-charcoal"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
