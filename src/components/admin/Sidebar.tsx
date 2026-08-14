"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth/jwt";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Layers,
  ShoppingBag,
  Inbox,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Siren,
  Activity,
  ScrollText,
  Store,
  MessageSquare,
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
    href: "/admin/inventory",
    label: "Inventory",
    icon: Boxes,
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
    href: "/admin/testimonials",
    label: "Testimonials",
    icon: MessageSquare,
    roles: ["OWNER", "ADMIN"],
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
    href: "/admin/privacy",
    label: "Privacy Requests",
    icon: ShieldAlert,
    // Not MANAGER: completing an erasure irreversibly destroys the identifying
    // half of an order record, and the last-owner and role-handover reasoning
    // for staff accounts sits with the same people who manage users.
    roles: ["OWNER", "ADMIN"],
  },
  {
    href: "/admin/settings",
    label: "Website Settings",
    icon: Settings,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    href: "/admin/permissions",
    label: "Roles & Permissions",
    icon: ShieldCheck,
    roles: ["OWNER", "ADMIN", "MANAGER"],
  },
  {
    href: "/admin/audit",
    label: "Audit Log",
    icon: ScrollText,
    // Owner-only: a log the people it watches can curate isn't a control.
    roles: ["OWNER"],
  },
  {
    href: "/admin/monitoring",
    label: "Monitoring",
    icon: Activity,
    // Operational rather than a control over staff, so ADMIN sees it too —
    // whoever is fixing the site needs to know what is broken.
    roles: ["OWNER", "ADMIN"],
  },
  {
    href: "/admin/security",
    label: "Security",
    icon: Siren,
    // Same reasoning as the audit log, and more so: the privilege-escalation
    // events here are the first thing an attacker with staff access would want
    // to remove.
    roles: ["OWNER"],
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
    <nav aria-label="Admin" className="flex-1 space-y-1 px-3 py-4">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-inset ${
              active
                ? "border-bronze bg-bronze/10 font-semibold text-gold"
                : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <item.icon aria-hidden="true" size={18} className="shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden w-60 flex-none border-r border-border bg-sidebar lg:flex lg:flex-col h-full">
      <div className="flex h-16 items-center justify-between px-6 border-b border-border/10">
        <span className="font-heading text-base text-sidebar-foreground font-medium">
          MAA Admin
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav role={role} />
      </div>
      <div className="p-4 border-t border-border/10">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-bronze px-4 py-2 text-sm font-medium text-ivory hover:bg-bronze/90 transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <Store aria-hidden="true" size={16} />
          Visit Store
        </Link>
      </div>
    </aside>
  );
}
