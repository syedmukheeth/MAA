import Link from "next/link";
import type { Role } from "@/lib/auth/jwt";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Inbox,
  BarChart3,
  Users,
} from "lucide-react";

const NAV_ITEMS: {
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
];

export function Sidebar({ role }: { role: Role }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-60 flex-none border-r border-border bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-16 items-center px-6">
        <span className="font-heading text-base text-sidebar-foreground">
          MAA Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
