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
import type { Role } from "@/lib/auth/jwt";

const ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "CUSTOMER"];

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
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

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
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
                    <SelectTrigger className="w-36">
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
                    disabled={isPending || u.id === currentUserId}
                    onClick={() => onToggleActive(u.id, !u.isActive)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      u.isActive
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-muted text-muted-foreground"
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
    </div>
  );
}
