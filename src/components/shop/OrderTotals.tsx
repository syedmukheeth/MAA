import { formatINR } from "@/lib/format";

/**
 * The money summary, shared by cart, checkout, and order detail so the customer
 * sees the same breakdown at every step.
 *
 * Prices are GST-inclusive: tax is shown as a component *of* the total, never
 * added to it. Delivery appears here rather than at the final step — a fee that
 * shows up after the customer has committed is the most-cited reason carts get
 * abandoned.
 */
export function OrderTotals({
  subtotal,
  deliveryFee,
  taxRate,
  taxAmount,
  total,
  className,
}: {
  subtotal: string;
  deliveryFee: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  className?: string;
}) {
  const delivery = Number(deliveryFee);
  const rate = Number(taxRate);

  return (
    <dl className={`space-y-3 rounded-xl border border-border bg-cream/40 p-5 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between text-sm">
        <dt className="text-graphite/70">Subtotal</dt>
        <dd className="tabular-nums text-charcoal">{formatINR(subtotal)}</dd>
      </div>

      <div className="flex items-baseline justify-between text-sm">
        <dt className="text-graphite/70">Delivery</dt>
        <dd className="tabular-nums text-charcoal">
          {delivery > 0 ? (
            formatINR(deliveryFee)
          ) : (
            <span className="text-bronze">Free</span>
          )}
        </dd>
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex items-baseline justify-between">
          <dt className="font-heading text-lg text-charcoal">Total</dt>
          <dd className="font-heading text-lg tabular-nums text-charcoal">
            {formatINR(total)}
          </dd>
        </div>
        {rate > 0 && (
          <p className="mt-1.5 text-xs text-graphite/60">
            Inclusive of {rate}% GST ({formatINR(taxAmount, { paise: true })})
          </p>
        )}
      </div>
    </dl>
  );
}
