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

  const options = NEXT_STATUS[current] ?? [];

  function onAdvance(next: string) {
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

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No further action</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          disabled={isPending}
          onClick={() => onAdvance(opt)}
          className="rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-bronze hover:text-bronze"
        >
          Mark as {opt}
        </button>
      ))}
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
