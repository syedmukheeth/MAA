"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function AccountTabs() {
  const pathname = usePathname();

  const tabs = [
    { label: "Profile", href: "/account" },
    { label: "Orders", href: "/account/orders" },
  ];

  return (
    <div className="mb-8 flex gap-6 border-b border-border text-sm items-center justify-between">
      <div className="flex gap-6">
        {tabs.map((tab) => {
          const active =
            tab.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 border-b-2 transition-colors ${
                active
                  ? "border-bronze font-semibold text-charcoal"
                  : "border-transparent text-graphite/60 hover:text-charcoal"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <form action={logoutAction} className="pb-3">
        <button
          type="submit"
          className="flex items-center gap-1 text-sm font-medium text-brand-red hover:underline cursor-pointer bg-transparent border-0 p-0"
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </button>
      </form>
    </div>
  );
}
