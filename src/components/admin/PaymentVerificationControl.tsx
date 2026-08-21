"use client";

import { useState, useTransition } from "react";
import { markOrderPaid } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

/**
 * The manual half of manual UPI: a customer paying by UPI transfers the money
 * themselves and then says they did. Nothing downstream may believe that until
 * a staff member matches it against the bank statement here — refunds in
 * particular are keyed on this state, not on the payment method.
 *
 * COD orders stay UNPAID until delivery and have no control: there is nothing
 * to verify before the goods arrive.
 */
export function PaymentVerificationControl({
  orderId,
  paymentMethod,
  paymentState,
  paymentReference,
}: {
  orderId: string;
  paymentMethod: string;
  paymentState: "UNPAID" | "AWAITING_VERIFICATION" | "PAID";
  paymentReference: string | null;
}) {
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (paymentState === "PAID") {
    return (
      <p className="text-sm text-muted-foreground">
        Payment confirmed received
        {paymentReference ? ` · reference ${paymentReference}` : ""}.
      </p>
    );
  }

  if (paymentState !== "AWAITING_VERIFICATION") {
    return (
      <p className="text-sm text-muted-foreground">
        {paymentMethod === "COD"
          ? "Cash on Delivery — collect on delivery. Nothing to verify here."
          : "No payment recorded yet."}
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await markOrderPaid(orderId, reference.trim() || undefined);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The customer says they paid by UPI. Check the bank statement before
        confirming — until you do, this order can be cancelled without any
        refund being owed.
      </p>
      <div className="space-y-2">
        <Label htmlFor="payment-reference">UPI reference / UTR (optional)</Label>
        <Input
          id="payment-reference"
          placeholder="e.g. 412345678901"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={isPending} size="sm">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Mark payment received
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
