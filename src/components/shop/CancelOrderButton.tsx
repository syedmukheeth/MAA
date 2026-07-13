"use client";

import { useState, useTransition } from "react";
import { cancelOwnOrder } from "@/actions/orders";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelOwnOrder(orderId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setCancelled(true);
    });
  }

  if (cancelled) {
    return <p className="text-sm text-graphite/60">Order cancelled.</p>;
  }

  return (
    <div>
      <button
        disabled={isPending}
        onClick={onCancel}
        className="rounded-full border border-brand-red px-5 py-2 text-sm text-brand-red hover:bg-brand-red/5"
      >
        {isPending ? "Cancelling..." : "Cancel Order"}
      </button>
      {error && <p className="mt-2 text-sm text-brand-red">{error}</p>}
    </div>
  );
}
