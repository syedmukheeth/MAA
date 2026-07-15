"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteCombo, toggleComboActive } from "@/actions/combos";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export type ComboRow = {
  id: string;
  name: string;
  bundlePrice: string;
  isActive: boolean;
  itemCount: number;
};

export function ComboTable({ combos }: { combos: ComboRow[] }) {
  const [rows, setRows] = useState(combos);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ComboRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteCombo(id);
      if (result?.error) {
        setError(result.error);
        setConfirming(null);
        return;
      }
      setRows((prev) => prev.filter((c) => c.id !== id));
      setConfirming(null);
    });
  }

  function onToggle(id: string, next: boolean) {
    startTransition(async () => {
      await toggleComboActive(id, next);
      setRows((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: next } : c))
      );
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
              <th className="px-4 py-3">Bundle Price</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  &#8377;{c.bundlePrice}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.itemCount} products
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={isPending}
                    onClick={() => onToggle(c.id, !c.isActive)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      c.isActive
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/combos/${c.id}/edit`}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirming(c)}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No combo offers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title="Delete combo offer?"
        description={
          confirming
            ? `"${confirming.name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        pending={isPending}
        onConfirm={() => confirming && onDelete(confirming.id)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
