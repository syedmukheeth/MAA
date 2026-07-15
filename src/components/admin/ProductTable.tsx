"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/products";
import { isInStock, isLowStock } from "@/lib/products";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: string;
  category: keyof typeof CATEGORY_LABELS;
  stockQuantity: number;
  lowStockThreshold: number;
  featured: boolean;
};

export function ProductTable({ products }: { products: ProductRow[] }) {
  const [rows, setRows] = useState(products);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ProductRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (result?.error) {
        setError(result.error);
        setConfirming(null);
        return;
      }
      setRows((prev) => prev.filter((p) => p.id !== id));
      setConfirming(null);
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
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-foreground">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {CATEGORY_LABELS[p.category]}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  &#8377;{p.price}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      !isInStock(p)
                        ? "text-destructive"
                        : isLowStock(p)
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    }
                  >
                    {p.stockQuantity} {!isInStock(p) && "(out of stock)"}
                    {isLowStock(p) && "(low)"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.featured ? "Yes" : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirming(p)}
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
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title="Delete product?"
        description={
          confirming
            ? `"${confirming.name}" will be permanently removed from the catalog. This cannot be undone.`
            : ""
        }
        pending={isPending}
        onConfirm={() => confirming && onDelete(confirming.id)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
