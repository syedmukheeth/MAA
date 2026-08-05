"use client";

import Link from "next/link";
import type { Role } from "@/lib/auth/jwt";
import { LayoutDashboard, ShoppingBag, AlertTriangle, Settings, ShieldCheck, Crown } from "lucide-react";

export function StaffBar({
  role,
  email,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}: {
  role: Role;
  email: string;
  pendingOrdersCount?: number;
  lowStockCount?: number;
}) {
  if (role !== "OWNER" && role !== "MANAGER" && role !== "ADMIN") return null;

  const isOwner = role === "OWNER";
  const isManager = role === "MANAGER";

  return (
    <div
      className={`w-full px-4 py-1.5 text-xs font-medium transition-colors ${
        isOwner
          ? "bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 text-amber-200 border-b border-amber-500/30"
          : "bg-gradient-to-r from-slate-900 via-stone-800 to-slate-900 text-stone-200 border-b border-stone-700/50"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Role Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isOwner
                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                : "bg-bronze/30 text-stone-200 border border-bronze/40"
            }`}
          >
            {isOwner ? (
              <>
                <Crown size={12} className="text-amber-400 shrink-0" />
                <span>Owner Mode</span>
              </>
            ) : isManager ? (
              <>
                <ShieldCheck size={12} className="text-stone-300 shrink-0" />
                <span>Manager Mode</span>
              </>
            ) : (
              <span>Admin Mode</span>
            )}
          </span>
          <span className="hidden sm:inline text-stone-400 text-[11px]">({email})</span>
        </div>

        {/* Center / Right: Quick Live Metrics & Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
            title="Pending Orders Queue"
          >
            <ShoppingBag size={13} className="text-bronze" />
            <span>Orders:</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                pendingOrdersCount > 0 ? "bg-amber-500 text-charcoal" : "bg-white/10 text-stone-300"
              }`}
            >
              {pendingOrdersCount}
            </span>
          </Link>

          <Link
            href="/admin/inventory"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
            title="Stock Alerts"
          >
            <AlertTriangle
              size={13}
              className={lowStockCount > 0 ? "text-amber-400 animate-pulse" : "text-stone-400"}
            />
            <span className="hidden sm:inline">Low Stock:</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                lowStockCount > 0 ? "bg-red-500 text-white" : "bg-white/10 text-stone-300"
              }`}
            >
              {lowStockCount}
            </span>
          </Link>

          <Link
            href="/admin/settings"
            className="hidden md:flex items-center gap-1 hover:text-white transition-colors"
            title="Website Settings"
          >
            <Settings size={13} />
            <span>Site Settings</span>
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-full bg-bronze/80 px-3 py-0.5 text-[11px] font-semibold text-ivory hover:bg-bronze transition-colors shadow-xs"
          >
            <LayoutDashboard size={13} />
            <span>Admin Dashboard →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
