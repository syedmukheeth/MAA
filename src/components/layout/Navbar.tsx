"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, ShoppingCart, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Shop", href: "/products" },
  { label: "Combos", href: "/combos" },
  { label: "Collections", href: "/#collections" },
  { label: "Craftsmanship", href: "/#craftsmanship" },
  { label: "Custom Studio", href: "/#custom-studio" },
  { label: "Showroom", href: "/#showroom" },
];

export type NavbarUser = {
  role: "OWNER" | "ADMIN" | "MANAGER" | "CUSTOMER";
} | null;

export function Navbar({ user = null }: { user?: NavbarUser }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;
  const isStaff = user != null && user.role !== "CUSTOMER";

  const accountLinks = user
    ? [
        ...(isStaff
          ? [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }]
          : [{ label: "My Account", href: "/account", icon: User }]),
        { label: "Cart", href: "/cart", icon: ShoppingCart },
      ]
    : [{ label: "Log In", href: "/login", icon: User }];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid
          ? "bg-ivory/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logo.jpeg"
            alt="MAA FURNITURE"
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
            MAA FURNITURE
          </span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
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

        <div className="hidden items-center gap-3 lg:flex">
          {accountLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              title={link.label}
              className={`rounded-full border p-2.5 transition-colors hover:border-bronze hover:text-bronze ${
                solid
                  ? "border-border text-graphite"
                  : "border-ivory/30 text-ivory"
              }`}
            >
              <link.icon size={17} />
            </Link>
          ))}
          <Button
            render={<Link href="/#custom-studio" />}
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
            {accountLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-base text-charcoal"
                >
                  <link.icon size={17} />
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
