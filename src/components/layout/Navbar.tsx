"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, ShoppingCart, User, X, LogOut, ArrowRight, Heart } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { useWishlist } from "@/hooks/use-wishlist";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Combo Offers", href: "/combos" },
  { label: "Custom Studio", href: "/custom-studio" },
  { label: "Showroom", href: "/showroom" },
];

export type NavbarUser = {
  role: "OWNER" | "ADMIN" | "MANAGER" | "CUSTOMER";
} | null;

export function Navbar({
  user = null,
  cartItemCount = 0,
}: {
  user?: NavbarUser;
  cartItemCount?: number;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { wishlist, isLoaded } = useWishlist();
  const wishlistCount = isLoaded ? wishlist.length : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const solid = !isHome || scrolled || open;
  const isStaff = user != null && user.role !== "CUSTOMER";

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/products") {
      return pathname.startsWith("/products") || pathname.startsWith("/product/");
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid
          ? "bg-ivory/95 backdrop-blur-md border-b border-linen shadow-xs py-2"
          : "bg-transparent py-4"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/brand/logo.jpeg"
            alt="MAA FURNITURE"
            width={40}
            height={40}
            className="rounded-full border border-bronze/20 transition-transform duration-500 group-hover:scale-105"
            priority
          />
          <span
            className={`font-heading text-base sm:text-lg tracking-wider transition-colors duration-300 ${
              solid ? "text-charcoal" : "text-ivory"
            }`}
          >
            MAA FURNITURE
          </span>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`relative text-xs uppercase tracking-widest transition-colors duration-300 hover:text-bronze ${
                    active
                      ? "text-bronze font-bold"
                      : solid
                        ? "text-graphite/90"
                        : "text-ivory/90"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-bronze rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop and Mobile Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wishlist Icon */}
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            title="Wishlist"
            className={`relative rounded-full border p-2 transition-colors duration-300 hover:border-bronze hover:text-bronze ${
              solid
                ? "border-linen text-graphite bg-white/50"
                : "border-ivory/20 text-ivory hover:bg-white/10"
            }`}
          >
            <Heart size={16} />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bronze text-[9px] font-bold text-ivory">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link
            href="/cart"
            aria-label="Cart"
            title="Cart"
            className={`relative rounded-full border p-2 transition-colors duration-300 hover:border-bronze hover:text-bronze ${
              solid
                ? "border-linen text-graphite bg-white/50"
                : "border-ivory/20 text-ivory hover:bg-white/10"
            }`}
          >
            <ShoppingCart size={16} />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bronze text-[9px] font-bold text-ivory animate-pulse">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* User Icon */}
          {user ? (
            <Link
              href={isStaff ? "/admin" : "/account"}
              aria-label={isStaff ? "Dashboard" : "My Account"}
              title={isStaff ? "Dashboard" : "My Account"}
              className={`rounded-full border p-2 transition-colors duration-300 hover:border-bronze hover:text-bronze ${
                solid
                  ? "border-linen text-graphite bg-white/50"
                  : "border-ivory/20 text-ivory hover:bg-white/10"
              }`}
            >
              {isStaff ? <LayoutDashboard size={16} /> : <User size={16} />}
            </Link>
          ) : (
            <Link
              href="/login"
              aria-label="Log In"
              title="Log In"
              className={`rounded-full border p-2 transition-colors duration-300 hover:border-bronze hover:text-bronze ${
                solid
                  ? "border-linen text-graphite bg-white/50"
                  : "border-ivory/20 text-ivory hover:bg-white/10"
              }`}
            >
              <User size={16} />
            </Link>
          )}

          {/* Logout Button (Desktop) */}
          {user && (
            <form action={logoutAction} className="hidden lg:block">
              <button
                type="submit"
                title="Log Out"
                className={`rounded-full border p-2 transition-colors duration-300 hover:border-destructive hover:text-destructive cursor-pointer ${
                  solid
                    ? "border-linen text-graphite bg-white/50"
                    : "border-ivory/20 text-ivory hover:bg-white/10"
                }`}
              >
                <LogOut size={16} />
              </button>
            </form>
          )}

          {/* Hamburger Menu (Mobile) */}
          <button
            className={`rounded-full border p-2 transition-colors lg:hidden ${
              solid
                ? "border-linen text-charcoal bg-white/50"
                : "border-ivory/20 text-ivory hover:bg-white/10"
            }`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-linen bg-ivory/95 backdrop-blur-md px-6 py-6 lg:hidden animate-in fade-in slide-in-from-top-5 duration-300">
          <ul className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <li key={link.href} className="border-b border-linen/50 pb-2">
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between text-sm uppercase tracking-wider transition-colors hover:text-bronze ${
                      active ? "text-bronze font-bold" : "text-charcoal/90"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight size={14} className="opacity-40" />
                  </Link>
                </li>
              );
            })}
            {user && (
              <li className="mt-2">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 text-sm uppercase tracking-wider text-brand-red hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </form>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
