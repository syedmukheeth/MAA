"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Search, Trash2, Loader2 } from "lucide-react";
import { deleteProduct, setProductActive } from "@/actions/products";
import { isInStock, isLowStock } from "@/lib/products";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: string;
  category: keyof typeof CATEGORY_LABELS;
  stockQuantity: number;
  lowStockThreshold: number;
  featured: boolean;
  isActive: boolean;
};

export function ProductTable({ products }: { products: ProductRow[] }) {
  const [rows, setRows] = useState(products);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<ProductRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (categoryFilter !== "ALL" && p.category !== categoryFilter)
        return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        CATEGORY_LABELS[p.category].toLowerCase().includes(q)
      );
    });
  }, [rows, query, categoryFilter]);

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

  function onToggleActive(p: ProductRow) {
    setError(null);
    setTogglingId(p.id);
    startTransition(async () => {
      const result = await setProductActive(p.id, !p.isActive);
      if (result?.error) {
        setError(result.error);
      } else {
        setRows((prev) =>
          prev.map((row) =>
            row.id === p.id ? { ...row, isActive: !p.isActive } : row
          )
        );
      }
      setTogglingId(null);
    });
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name, slug, or category..."
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v ?? "ALL")}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((p) => (
              <tr key={p.id} className={p.isActive ? undefined : "opacity-60"}>
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
                <td className="px-4 py-3">
                  {p.isActive ? (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.featured ? "Yes" : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={isPending && togglingId === p.id}
                      onClick={() => onToggleActive(p)}
                      title={
                        p.isActive
                          ? "Deactivate (hide from storefront)"
                          : "Activate (show on storefront)"
                      }
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground flex items-center justify-center"
                    >
                      {isPending && togglingId === p.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : p.isActive ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
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
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {rows.length === 0
                    ? "No products yet."
                    : `No products match "${query}".`}
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
            ? `"${confirming.name}" will be permanently removed from the catalog. This cannot be undone. If the product only has a temporary issue, deactivate it instead.`
            : ""
        }
        pending={isPending}
        onConfirm={() => confirming && onDelete(confirming.id)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
