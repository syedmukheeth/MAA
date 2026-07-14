"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/jwt";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Inbox,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

export const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    href: "/admin/products",
    label: "Products",
    icon: Package,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    href: "/admin/combos",
    label: "Combo Offers",
    icon: Layers,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: ShoppingBag,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    href: "/admin/requests",
    label: "Custom Requests",
    icon: Inbox,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["OWNER", "ADMIN"],
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["OWNER", "ADMIN"],
  },
  {
    href: "/admin/settings",
    label: "Website Settings",
    icon: Settings,
    roles: ["OWNER", "ADMIN"],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden w-60 flex-none border-r border-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-6">
        <span className="font-heading text-base text-sidebar-foreground">
          MAA Admin
        </span>
      </div>
      <SidebarNav role={role} />
    </aside>
  );
}
