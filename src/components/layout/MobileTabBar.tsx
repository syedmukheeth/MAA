"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";

/**
 * Mobile tab bar.
 *
 * z-40 on purpose: below the z-50 dialog/sheet overlays and the z-[100]
 * lightbox, so anything modal covers it rather than fighting it. Both (shop)
 * and (account) layouts add `pb-16 lg:pb-0` to <main> to reserve its height —
 * without that it sits on top of the footer.
 */
const TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/products", label: "Shop", icon: LayoutGrid },
  { href: "/wishlist", label: "Saved", icon: Heart, badge: "wishlist" as const },
  { href: "/cart", label: "Cart", icon: ShoppingBag, badge: "cart" as const },
  { href: "/account", label: "Account", icon: User },
];

export function MobileTabBar({ cartItemCount = 0 }: { cartItemCount?: number }) {
  const pathname = usePathname();
  const { wishlist, isLoaded } = useWishlist();
  const wishlistCount = isLoaded ? wishlist.length : 0;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-ivory/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href) ||
              (tab.href === "/products" && pathname.startsWith("/product/"));
          const count =
            tab.badge === "wishlist"
              ? wishlistCount
              : tab.badge === "cart"
                ? cartItemCount
                : 0;
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 transition-colors duration-300 ${
                  active ? "text-bronze" : "text-graphite/70"
                }`}
              >
                <span className="relative">
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex min-w-3.5 items-center justify-center rounded-full bg-bronze px-1 text-[8px] font-semibold leading-3.5 text-ivory">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className="text-[0.6rem] font-medium tracking-wide">{tab.label}</span>
                {active && (
                  <span className="absolute inset-x-5 top-0 h-px bg-bronze" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
