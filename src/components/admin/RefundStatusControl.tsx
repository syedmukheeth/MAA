"use client";

import { useState } from "react";
import { updateRefundStatus } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Props = {
  orderId: string;
  refundStatus: "PENDING" | "PROCESSED" | "FAILED" | "NOT_APPLICABLE";
  refundAmount: string | null;
  refundTxnId: string | null;
  refundNotes: string | null;
};

export function RefundStatusControl({
  orderId,
  refundStatus: initialStatus,
  refundAmount: initialAmount,
  refundTxnId: initialTxnId,
  refundNotes: initialNotes,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [txnId, setTxnId] = useState(initialTxnId ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [amount, setAmount] = useState(initialAmount ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateRefundStatus(orderId, {
      status,
      refundTxnId: txnId.trim() || undefined,
      notes: notes.trim() || undefined,
      amount: amount.trim() || undefined,
    });

    setLoading(false);
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Refund status updated successfully" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="refund-status">Refund Status</Label>
          <select
            id="refund-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Props["refundStatus"])}
            className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm shadow-sm outline-none focus:ring-1 focus:ring-ring [&_option]:bg-popover [&_option]:text-popover-foreground"
          >
            <option value="PENDING" className="bg-popover text-popover-foreground">Pending Refund</option>
            <option value="PROCESSED" className="bg-popover text-popover-foreground">Processed / Completed</option>
            <option value="FAILED" className="bg-popover text-popover-foreground">Refund Failed</option>
            <option value="NOT_APPLICABLE" className="bg-popover text-popover-foreground">Not Applicable</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="refund-amount">Refund Amount (₹)</Label>
          <Input
            id="refund-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="refund-txnid">Transaction ID / Reference Number</Label>
        <Input
          id="refund-txnid"
          placeholder="e.g. RZR-REFUND-992812 or UTR129038"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="refund-notes">Internal Refund Notes</Label>
        <Input
          id="refund-notes"
          placeholder="e.g. Processed via Razorpay Dashboard / Bank NEFT"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading} size="sm">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update Refund Record
      </Button>
    </form>
  );
}
