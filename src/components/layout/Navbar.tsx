"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { BrandMark } from "@/components/layout/BrandMark";
import { NavSearch } from "@/components/layout/NavSearch";
import { ShopMenu } from "@/components/layout/ShopMenu";
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from "@/components/icons/social";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import type { RoomCategory } from "@/lib/shop-sections";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { whatsappLink } from "@/lib/whatsapp";

/** Shop is not here — it is the mega-menu trigger, rendered separately. */
const NAV_LINKS = [
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
  categories,
  featuredImageUrl,
  phone,
  whatsapp,
  instagramUrl,
  facebookUrl,
}: {
  user?: NavbarUser;
  cartItemCount?: number;
  categories: RoomCategory[];
  featuredImageUrl: string;
  phone?: string;
  whatsapp?: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const { wishlist, isLoaded } = useWishlist();
  const wishlistCount = isLoaded ? wishlist.length : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any navigation closes everything — including browser back/forward, which no
  // onClick handler sees. Adjusted during render rather than in an effect: an
  // effect here would paint the new route with the old menu still open, then
  // cascade a second render to close it.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setShopOpen(false);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen && !shopOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setShopOpen(false);
      setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, shopOpen]);

  // Scroll lock for the full-screen drawer. Restores whatever overflow the
  // document had rather than assuming "visible".
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const isHome = pathname === "/";
  // Transparent only over the hero: on home, unscrolled, with nothing open.
  const solid = !isHome || scrolled || drawerOpen || shopOpen;
  const isStaff = user != null && user.role !== "CUSTOMER";
  const whatsappHref = whatsappLink(whatsapp);
  const phoneNumbers = (phone ?? "")
    .split(",")
    .map((p) => p.replace(/[^0-9+]/g, ""))
    .filter(Boolean);

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
  const shopActive =
    pathname.startsWith("/products") || pathname.startsWith("/product/");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-header transition-colors duration-500 ease-brand ${
        solid
          ? "border-b border-hairline bg-ivory/80 shadow-lift backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-header max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
        <Link href="/" className="group shrink-0" aria-label="MAA FURNITURE, home">
          <BrandMark size="sm" tone={solid ? "dark" : "light"} />
        </Link>

        <ul className="hidden items-center gap-9 lg:flex">
          <ShopMenu
            categories={categories}
            featuredImageUrl={featuredImageUrl}
            solid={solid}
            open={shopOpen}
            onOpen={() => setShopOpen(true)}
            onClose={() => setShopOpen(false)}
            active={shopActive}
          />
          {NAV_LINKS.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-[0.7rem] font-medium uppercase tracking-eyebrow transition-colors duration-300 hover:text-bronze ${
                    active ? "text-bronze" : solid ? "text-graphite" : "text-ivory/90"
                  }`}
                >
                  {link.label}
                </Link>
                {active && (
                  // Shared layoutId with the Shop trigger's rule: the indicator
                  // slides between items instead of blinking out and in.
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-2 left-0 right-0 h-px bg-bronze"
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden xl:block">
            <NavSearch solid={solid} />
          </div>

          <NavIcon href="/wishlist" label="Wishlist" solid={solid} badge={wishlistCount}>
            <Heart size={15} />
          </NavIcon>

          <NavIcon href="/cart" label="Cart" solid={solid} badge={cartItemCount}>
            <ShoppingBag size={15} />
          </NavIcon>

          <NavIcon
            href={user ? (isStaff ? "/admin" : "/account") : "/login"}
            label={user ? (isStaff ? "Dashboard" : "My account") : "Log in"}
            solid={solid}
          >
            {isStaff ? <LayoutDashboard size={15} /> : <User size={15} />}
          </NavIcon>

          {user && (
            <form action={logoutAction} className="hidden lg:block">
              <button
                type="submit"
                title="Log out"
                aria-label="Log out"
                className={`flex size-9 cursor-pointer items-center justify-center rounded-full border transition-colors duration-300 ease-brand hover:border-destructive hover:text-destructive ${
                  solid
                    ? "border-hairline bg-white/60 text-graphite"
                    : "border-ivory/25 text-ivory hover:bg-ivory/10"
                }`}
              >
                <LogOut size={15} />
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            className={`flex size-9 items-center justify-center rounded-full border transition-colors duration-300 ease-brand lg:hidden ${
              solid
                ? "border-hairline bg-white/60 text-charcoal"
                : "border-ivory/25 text-ivory hover:bg-ivory/10"
            }`}
          >
            {drawerOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer — full sheet below the bar, not a squeezed accordion. */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR.fast }}
            className="fixed inset-x-0 bottom-0 top-header overflow-y-auto border-t border-hairline bg-ivory lg:hidden"
          >
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: DUR.base, ease: EASE.out }}
              className="px-6 pb-16 pt-6"
            >
              <NavSearch
                solid
                variant="inline"
                onNavigate={() => setDrawerOpen(false)}
              />

              <ul className="mt-7 space-y-1">
                <li className="border-b border-hairline">
                  <button
                    type="button"
                    onClick={() => setCatsOpen((v) => !v)}
                    aria-expanded={catsOpen}
                    className={`flex w-full items-center justify-between py-3.5 font-heading text-2xl ${
                      shopActive ? "text-bronze" : "text-charcoal"
                    }`}
                  >
                    Shop
                    <ChevronDown
                      size={18}
                      className={`text-graphite/40 transition-transform duration-300 ease-brand ${
                        catsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {catsOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: DUR.fast, ease: EASE.out }}
                        className="overflow-hidden"
                      >
                        {categories.map((key) => (
                          <li key={key}>
                            <Link
                              href={`/products?category=${key}`}
                              onClick={() => setDrawerOpen(false)}
                              className="block py-2 pl-4 text-sm text-graphite"
                            >
                              {CATEGORY_LABELS[key]}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            href="/products"
                            onClick={() => setDrawerOpen(false)}
                            className="block py-2 pb-4 pl-4 text-sm font-medium text-bronze"
                          >
                            All products
                          </Link>
                        </li>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>

                {NAV_LINKS.map((link, i) => {
                  const active = isLinkActive(link.href);
                  return (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * STAGGER.base, duration: DUR.base, ease: EASE.out }}
                      className="border-b border-hairline"
                    >
                      <Link
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`block py-3.5 font-heading text-2xl ${
                          active ? "text-bronze" : "text-charcoal"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <div className="mt-8 space-y-3">
                {phoneNumbers.map((num) => (
                  <a
                    key={num}
                    href={`tel:${num}`}
                    className="flex items-center gap-3 text-sm text-graphite"
                  >
                    <Phone size={15} className="text-bronze" />
                    {num}
                  </a>
                ))}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-graphite"
                  >
                    <WhatsAppIcon size={16} className="text-bronze" />
                    Message us on WhatsApp
                  </a>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3 border-t border-hairline pt-6">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="rounded-full border border-hairline p-2.5 text-graphite transition-colors hover:border-bronze hover:text-bronze"
                  >
                    <InstagramIcon size={16} />
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="rounded-full border border-hairline p-2.5 text-graphite transition-colors hover:border-bronze hover:text-bronze"
                  >
                    <FacebookIcon size={16} />
                  </a>
                )}
                {user && (
                  <form action={logoutAction} className="ml-auto">
                    <button
                      type="submit"
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-red"
                    >
                      <LogOut size={14} />
                      Log out
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/**
 * One circular header action. Replaces five near-identical copies of the same
 * solid/transparent ternary, which is where the states drifted apart.
 */
function NavIcon({
  href,
  label,
  solid,
  badge = 0,
  children,
}: {
  href: string;
  label: string;
  solid: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`relative flex size-9 items-center justify-center rounded-full border transition-colors duration-300 ease-brand hover:border-bronze hover:text-bronze ${
        solid
          ? "border-hairline bg-white/60 text-graphite"
          : "border-ivory/25 text-ivory hover:bg-ivory/10"
      }`}
    >
      {children}
      {badge > 0 && (
        // Keyed on the count so it pops once when the number changes, instead
        // of the old animate-pulse that never stopped drawing attention.
        <motion.span
          key={badge}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: DUR.fast, ease: EASE.out }}
          className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-bronze px-1 text-[9px] font-semibold leading-4 text-ivory"
        >
          {badge > 9 ? "9+" : badge}
        </motion.span>
      )}
    </Link>
  );
}
