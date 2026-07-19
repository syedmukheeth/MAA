"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/orders";

const NEXT_STATUS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const PREDEFINED_REASONS = [
  "Customer requested cancellation",
  "Out of stock / unable to fulfill",
  "Payment verification failed",
  "Incorrect address/contact details",
  "Delivery service unavailable in area",
];

export function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  const options = NEXT_STATUS[current] ?? [];

  function onAdvance(next: string) {
    if (next === "CANCELLED") {
      setShowCancelPrompt(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setCurrent(next);
    });
  }

  function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalReason = selectedReason === "Other" ? customReason : selectedReason;
    if (selectedReason === "Other" && !customReason.trim()) {
      setError("Please specify a custom reason.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, "CANCELLED", finalReason);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setCurrent("CANCELLED");
      setShowCancelPrompt(false);
    });
  }

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No further action</p>;
  }

  return (
    <div className="space-y-4">
      {showCancelPrompt ? (
        <form onSubmit={handleCancelSubmit} className="space-y-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 animate-fadeIn">
          <p className="text-sm font-semibold text-foreground">Select Cancellation Reason</p>
          <div className="space-y-2">
            {PREDEFINED_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name="cancelReason"
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="size-4"
                />
                {r}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="cancelReason"
                checked={selectedReason === "Other"}
                onChange={() => setSelectedReason("Other")}
                className="size-4"
              />
              Other (write custom reason below)
            </label>
          </div>

          {selectedReason === "Other" && (
            <textarea
              placeholder="Type custom cancellation reason here..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full rounded-md border border-border bg-background p-2.5 text-sm text-foreground focus:ring-1 focus:ring-bronze"
              rows={2}
              required
            />
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-destructive px-4 py-1.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Confirm Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowCancelPrompt(false)}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:bg-muted cursor-pointer"
            >
              Back
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              disabled={isPending}
              onClick={() => onAdvance(opt)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                opt === "CANCELLED"
                  ? "border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive"
                  : "border-border text-foreground hover:border-bronze hover:text-bronze"
              }`}
            >
              Mark as {opt}
            </button>
          ))}
        </div>
      )}
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
