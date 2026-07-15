import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Inbox,
  IndianRupee,
  Boxes,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getLowStockVariants } from "@/lib/analytics";

const REVENUE_STATUSES = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

function inr(value: number) {
  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    productCount,
    pendingOrders,
    ordersToday,
    pendingRequests,
    revenueAgg,
    lowStockData,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.customFurnitureRequest.count({
      where: { status: { in: ["NEW", "IN_REVIEW"] } },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: [...REVENUE_STATUSES] },
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { total: true },
    }),
    getLowStockVariants(6),
  ]);

  const showRevenue = user?.role === "OWNER" || user?.role === "ADMIN";
  const lowStockCount =
    lowStockData.lowStock.length + lowStockData.outOfStockCount;

  const cards = [
    {
      label: "Orders today",
      value: String(ordersToday),
      icon: Clock,
      href: "/admin/orders",
    },
    {
      label: "Pending orders",
      value: String(pendingOrders),
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    ...(showRevenue
      ? [
          {
            label: "Revenue (30d)",
            value: inr(Number(revenueAgg._sum.total ?? 0)),
            icon: IndianRupee,
            href: "/admin/analytics",
          },
        ]
      : []),
    {
      label: "Products",
      value: String(productCount),
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Stock alerts",
      value: String(lowStockCount),
      icon: Boxes,
      href: "/admin/inventory",
      alert: lowStockCount > 0,
    },
    {
      label: "Open custom requests",
      value: String(pendingRequests),
      icon: Inbox,
      href: "/admin/requests",
    },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl text-foreground">
        Welcome back{user ? `, ${user.email}` : ""}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Today&apos;s snapshot of the store.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border p-5 transition-colors hover:border-bronze/60 ${
              card.alert
                ? "border-amber-500/40 bg-amber-500/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <card.icon
                size={16}
                className={card.alert ? "text-amber-500" : "text-muted-foreground"}
              />
            </div>
            <p
              className={`mt-2 font-heading text-2xl ${
                card.alert ? "text-amber-500" : "text-foreground"
              }`}
            >
              {card.value}
            </p>
          </Link>
        ))}
      </div>

      {lowStockData.lowStock.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-amber-500">
              Low stock
            </p>
            <Link
              href="/admin/inventory"
              className="text-xs text-amber-500 hover:underline"
            >
              Open inventory →
            </Link>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {lowStockData.lowStock.map((v) => (
              <li key={v.id} className="flex justify-between">
                <span>
                  {v.product.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {v.name}
                  </span>
                </span>
                <span className="text-amber-500">{v.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRevenue && (
        <Link
          href="/admin/analytics"
          className="mt-8 inline-block rounded-full bg-bronze px-6 py-2.5 text-sm text-ivory hover:bg-bronze/90"
        >
          View full insights
        </Link>
      )}
    </div>
  );
}
