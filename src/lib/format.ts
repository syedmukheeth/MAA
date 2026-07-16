/**
 * Isomorphic formatting helpers — safe in client components.
 *
 * Deliberately separate from `@/lib/money`: that module imports Prisma for
 * Decimal arithmetic, which drags `node:module` into the browser bundle and
 * fails the build. Formatting needs no Decimal — only a string or number — so
 * it lives here and both sides can use it.
 */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_PAISE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Display formatter for rupee amounts.
 *
 * Accepts the Decimal-as-string that server components pass down. Whole rupees
 * by default — furniture prices are round; pass `paise` for invoice lines where
 * the tax component genuinely has decimals.
 */
export function formatINR(
  value: string | number | null | undefined,
  opts?: { paise?: boolean }
): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "—";
  return opts?.paise ? INR_PAISE.format(n) : INR.format(n);
}
