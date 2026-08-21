import type { PaymentState } from "@/generated/prisma/client";

/**
 * Whether the shop is holding this customer's money.
 *
 * The one rule that decides whether cancelling an order owes anybody anything.
 * It lives here, in one place, because it used to be spelled three different
 * ways across src/actions/orders.ts as `paymentMethod !== "COD"` — a check on a
 * string the customer themselves supplied, which meant an unpaid order could be
 * cancelled into the refund queue for its full total.
 *
 * COD is UNPAID until delivery; manual UPI is AWAITING_VERIFICATION until a
 * staff member matches it against the bank statement (markOrderPaid).
 */
export function isRefundable(paymentState: PaymentState): boolean {
  return paymentState === "PAID";
}
