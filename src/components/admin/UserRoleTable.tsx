"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeUserRole, setUserActive } from "@/actions/users";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { Role } from "@/lib/auth/jwt";

const ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "CUSTOMER"];

/**
 * Must stay in step with the `select` in admin/users/page.tsx. This type is
 * documentation, not enforcement — React serialises whatever the query
 * returned, so widening the query is what leaks, not widening this.
 */
export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  /** Non-null once the account has been erased under a DPDP request. */
  erasedAt?: Date | null;
};

export function UserRoleTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [rows, setRows] = useState(users);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Suspending locks a colleague out of the back office. One misclick on a
  // status pill should not be able to do that.
  const [pendingSuspend, setPendingSuspend] = useState<UserRow | null>(null);

  function onRoleChange(userId: string, role: Role) {
    setError(null);
    startTransition(async () => {
      const result = await changeUserRole(userId, role);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    });
  }

  function onToggleActive(userId: string, isActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setUserActive(userId, isActive);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive } : u)));
    });
  }

  function requestToggleActive(user: UserRow) {
    // Reactivating is harmless and reversible; suspending is not.
    if (user.isActive) {
      setPendingSuspend(user);
      return;
    }
    onToggleActive(user.id, true);
  }

  return (
    <div>
      <div aria-live="polite">
        {error && (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-foreground">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={u.role}
                    onValueChange={(v) => onRoleChange(u.id, v as Role)}
                    disabled={isPending || u.id === currentUserId}
                  >
                    <SelectTrigger className="w-36" aria-label={`Role for ${u.name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={isPending || u.id === currentUserId}
                    onClick={() => requestToggleActive(u)}
                    aria-label={`${u.name} is ${
                      u.isActive ? "active" : "suspended"
                    } — ${u.isActive ? "suspend" : "reactivate"}`}
                    className={`rounded-full px-3 py-1 text-xs transition-colors touch-manipulation disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      u.isActive
                        ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {u.isActive ? "Active" : "Suspended"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingSuspend !== null}
        title="Suspend this user?"
        description={
          pendingSuspend
            ? `${pendingSuspend.name} (${pendingSuspend.email}) will be signed out of the back office and blocked from logging in. You can reactivate them at any time.`
            : ""
        }
        confirmLabel="Suspend"
        pending={isPending}
        onConfirm={() => {
          if (pendingSuspend) onToggleActive(pendingSuspend.id, false);
          setPendingSuspend(null);
        }}
        onCancel={() => setPendingSuspend(null)}
      />
    </div>
  );
}
