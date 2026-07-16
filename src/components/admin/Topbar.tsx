"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, Store } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { SidebarNav } from "@/components/admin/Sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Role } from "@/lib/auth/jwt";

export function Topbar({
  email,
  role,
}: {
  email: string;
  role: Role;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 flex-none items-center justify-between border-b border-border bg-background px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="text-foreground lg:hidden"
        >
          <Menu size={22} />
        </button>
        <SheetContent side="left" className="dark w-64 p-0 bg-background text-foreground flex flex-col h-full border-r border-border">
          <SheetHeader className="border-b border-border/10 p-4">
            <SheetTitle className="text-foreground">MAA Admin</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav role={role} onNavigate={() => setOpen(false)} />
          </div>
          <div className="p-4 border-t border-border/10">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-bronze px-4 py-2 text-sm font-medium text-ivory hover:bg-bronze/90 transition-colors"
            >
              <Store size={16} />
              Visit Store
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block">
        <p className="font-heading text-sm text-muted-foreground">
          MAA FURNITURE — Back Office
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-bronze/50 px-3 py-1.5 text-sm text-bronze transition-colors hover:bg-bronze hover:text-ivory"
        >
          <Store size={15} />
          <span className="hidden sm:inline">Visit Store</span>
        </Link>
        <div className="hidden md:block text-right">
          <p className="text-sm text-foreground max-w-[150px] truncate">{email}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {role.toLowerCase()}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Log out"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer flex items-center justify-center"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
