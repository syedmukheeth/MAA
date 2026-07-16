"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Star } from "lucide-react";
import { deleteTestimonial, toggleTestimonialPublished } from "@/actions/testimonials";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export type TestimonialRow = {
  id: string;
  name: string;
  location: string | null;
  quote: string;
  rating: number;
  isPublished: boolean;
  sortOrder: number;
};

export function TestimonialTable({ testimonials }: { testimonials: TestimonialRow[] }) {
  const [rows, setRows] = useState(testimonials);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<TestimonialRow | null>(null);
  const [isPending, startTransition] = useTransition();

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteTestimonial(id);
      if (result?.error) {
        setError(result.error);
        setConfirming(null);
        return;
      }
      setRows((prev) => prev.filter((t) => t.id !== id));
      setConfirming(null);
    });
  }

  function onToggle(id: string, next: boolean) {
    startTransition(async () => {
      await toggleTestimonialPublished(id, next);
      setRows((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPublished: next } : t))
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
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Sort Order</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-foreground font-medium">{t.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.location || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < t.rating ? "currentColor" : "none"}
                        className={i < t.rating ? "text-gold" : "text-muted-foreground/30"}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.sortOrder}</td>
                <td className="px-4 py-3">
                  <button
                    disabled={isPending}
                    onClick={() => onToggle(t.id, !t.isPublished)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      t.isPublished
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.isPublished ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/testimonials/${t.id}/edit`}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirming(t)}
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
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No testimonials yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title="Delete testimonial?"
        description={
          confirming
            ? `The testimonial from "${confirming.name}" will be permanently removed. This cannot be undone.`
            : ""
        }
        pending={isPending}
        onConfirm={() => confirming && onDelete(confirming.id)}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
