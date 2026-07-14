"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
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
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle>MAA Admin</SheetTitle>
          </SheetHeader>
          <SidebarNav role={role} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-foreground">{email}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {role.toLowerCase()}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Log out"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
