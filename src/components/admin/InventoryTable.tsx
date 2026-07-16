"use client";

import { useState, useTransition } from "react";
import { PackagePlus, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { receiveStock, adjustStock } from "@/actions/inventory";

export type InventoryRow = {
  id: string;
  productName: string;
  variantName: string;
  isDefault: boolean;
  sku: string | null;
  woodType: string | null;
  finish: string | null;
  size: string | null;
  stock: number;
  lowStockThreshold: number;
};

type DialogState =
  | { mode: "receive"; row: InventoryRow }
  | { mode: "adjust"; row: InventoryRow }
  | null;

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? rows.filter((r) =>
        `${r.productName} ${r.variantName} ${r.sku ?? ""}`
          .toLowerCase()
          .includes(filter.toLowerCase())
      )
    : rows;

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Search product, variant, SKU..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => {
              const out = r.stock === 0;
              const low = !out && r.stock <= r.lowStockThreshold;
              const attrs = [r.woodType, r.finish, r.size]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-foreground">
                    {r.productName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.variantName}
                    {attrs && (
                      <span className="ml-2 text-xs opacity-70">{attrs}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.sku ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        out
                          ? "text-destructive"
                          : low
                            ? "text-amber-500"
                            : "text-muted-foreground"
                      }
                    >
                      {r.stock}
                    </span>
                    {low && (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">
                        Low
                      </span>
                    )}
                    {out && (
                      <span className="ml-2 rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
                        Out
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        title="Receive stock"
                        onClick={() => setDialog({ mode: "receive", row: r })}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <PackagePlus size={16} />
                      </button>
                      <button
                        type="button"
                        title="Adjust stock"
                        onClick={() => setDialog({ mode: "adjust", row: r })}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <SlidersHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {rows.length === 0
                    ? "No variants yet. Create a product first."
                    : "No matches."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dialog?.mode === "receive" && (
        <ReceiveDialog row={dialog.row} onClose={() => setDialog(null)} />
      )}
      {dialog?.mode === "adjust" && (
        <AdjustDialog row={dialog.row} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function ReceiveDialog({
  row,
  onClose,
}: {
  row: InventoryRow;
  onClose: () => void;
}) {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await receiveStock({
        variantId: row.id,
        qty: Number(qty),
        reason: reason || undefined,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dark">
        <DialogHeader>
          <DialogTitle>Receive stock</DialogTitle>
          <DialogDescription>
            {row.productName} — {row.variantName} (current: {row.stock})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receive-qty">Quantity received</Label>
            <Input
              id="receive-qty"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receive-reason">Note (optional)</Label>
            <Input
              id="receive-reason"
              placeholder="Supplier delivery"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !qty}>
            {isPending ? "Saving..." : "Receive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustDialog({
  row,
  onClose,
}: {
  row: InventoryRow;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [damaged, setDamaged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await adjustStock({
        variantId: row.id,
        delta: Number(delta),
        reason,
        damaged,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dark">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {row.productName} — {row.variantName} (current: {row.stock}).
            Use a negative number to remove stock.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adjust-delta">Adjustment (+/-)</Label>
            <Input
              id="adjust-delta"
              type="number"
              placeholder="-2"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-reason">Reason (required)</Label>
            <Input
              id="adjust-reason"
              placeholder="Stocktake correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={damaged}
              onChange={(e) => setDamaged(e.target.checked)}
              className="size-4 rounded border-border"
            />
            Mark as damaged stock
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || !delta || !reason}>
            {isPending ? "Saving..." : "Adjust"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
