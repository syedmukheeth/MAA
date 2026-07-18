"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateRequestStatus } from "@/actions/custom-requests";
import {
  REQUEST_STATUS_FLOW,
  REQUEST_STATUS_LABELS,
  REQUEST_ACTION_LABELS,
  type RequestStatusValue,
} from "@/lib/validations/custom-request";

export function RequestStatusControl({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const [current, setCurrent] = useState(status as RequestStatusValue);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const allowedNext = REQUEST_STATUS_FLOW[current] ?? [];

  function move(next: RequestStatusValue, note?: string) {
    setError(null);
    startTransition(async () => {
      const res = await updateRequestStatus(requestId, next, note);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setCurrent(next);
      setRejecting(false);
      setReason("");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            current === "CONVERTED"
              ? "bg-green-500/10 text-green-600"
              : current === "CLOSED"
                ? "bg-destructive/10 text-destructive"
                : current === "NEW"
                  ? "bg-bronze/10 text-bronze"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {REQUEST_STATUS_LABELS[current] ?? current}
        </span>

        {allowedNext.map((next) =>
          next === "CLOSED" ? (
            <Button
              key={next}
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setRejecting(true)}
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              {REQUEST_ACTION_LABELS[next]}
            </Button>
          ) : (
            <Button
              key={next}
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => move(next)}
              className="rounded-full bg-bronze text-ivory hover:bg-bronze/90"
            >
              {REQUEST_ACTION_LABELS[next]}
            </Button>
          )
        )}
      </div>

      {rejecting && (
        <div className="max-w-md space-y-2 rounded-lg border border-border p-4">
          <p className="text-sm text-foreground">
            Reason for rejecting / cancelling this request
          </p>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Outside our production capability, customer unreachable..."
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending || reason.trim().length < 3}
              onClick={() => move("CLOSED", reason)}
            >
              {isPending ? "Saving..." : "Confirm"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setRejecting(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
