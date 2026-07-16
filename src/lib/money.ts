import { Prisma } from "@/generated/prisma/client";

export type Money = Prisma.Decimal;

/**
 * Anything we can safely construct a Decimal from. Note `Prisma.Decimal` is a
 * type alias, not a namespace, so `Prisma.Decimal.Value` doesn't exist — this
 * is the equivalent.
 */
export type MoneyInput = string | number | Prisma.Decimal;

/**
 * Money must never touch JS floats.
 *
 * `0.1 + 0.2 === 0.30000000000000004`. At whole-rupee sofa prices that error
 * hides; the moment a percentage (GST) or a discount enters the arithmetic it
 * compounds and lands in a column typed DECIMAL(10,2) — silently rounded, and
 * wrong by paise on an invoice that has to reconcile.
 *
 * Prisma already hands us Decimal on the way out of the database. This module
 * exists so it stays Decimal all the way through the calculation and back in.
 */
export function money(value: MoneyInput): Money {
  return new Prisma.Decimal(value);
}

export const ZERO = (): Money => new Prisma.Decimal(0);

/** Round half-up to paise — the convention Indian invoices expect. */
export function toPaise(value: Money): Money {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function sum(values: Money[]): Money {
  return values.reduce<Money>((acc, v) => acc.plus(v), ZERO());
}

/**
 * Extract the GST component contained *within* a GST-inclusive amount.
 *
 *   tax = gross × rate / (100 + rate)
 *
 * Indian B2C retail displays tax-inclusive prices, so this pulls the tax out
 * rather than adding it on. Adding it on would raise the price the customer
 * already agreed to at the last step — the single most-cited cause of cart
 * abandonment, and the thing CommerceOS §11 forbids.
 */
export function taxWithin(grossInclusive: Money, ratePercent: Money): Money {
  const denominator = new Prisma.Decimal(100).plus(ratePercent);
  if (denominator.isZero()) return ZERO();
  return toPaise(grossInclusive.times(ratePercent).dividedBy(denominator));
}

/** Delivery is waived at/above the threshold, when one is configured. */
export function deliveryFeeFor(
  subtotal: Money,
  fee: Money,
  freeThreshold: Money | null | undefined
): Money {
  if (fee.lessThanOrEqualTo(0)) return ZERO();
  if (freeThreshold && subtotal.greaterThanOrEqualTo(freeThreshold)) return ZERO();
  return toPaise(fee);
}

/**
 * Re-exported for server callers so `@/lib/money` stays the one import for
 * money work. The implementation lives in `@/lib/format` because it must be
 * usable from client components, which cannot import Prisma.
 */
export { formatINR } from "@/lib/format";
