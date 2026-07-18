const formatInr = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/**
 * Selling price with struck-through MRP and discount badge, shown only when
 * the MRP is actually higher than the selling price.
 */
export function PriceBlock({
  price,
  mrp,
  size = "md",
  className = "",
}: {
  price: string | number;
  mrp?: string | number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const priceNum = Number(price);
  const mrpNum = mrp == null || mrp === "" ? null : Number(mrp);
  const hasOffer = mrpNum !== null && mrpNum > priceNum;
  const offPct = hasOffer ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

  const priceClass =
    size === "lg"
      ? "text-2xl font-medium"
      : size === "sm"
        ? "text-sm font-medium"
        : "text-base font-medium";
  const subClass = size === "lg" ? "text-base" : "text-xs";

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className={`${priceClass} text-charcoal`}>{formatInr(priceNum)}</span>
      {hasOffer && (
        <>
          <span className={`${subClass} text-graphite/50 line-through`}>
            {formatInr(mrpNum)}
          </span>
          <span className={`${subClass} font-semibold text-green-600`}>
            {offPct}% off
          </span>
        </>
      )}
    </span>
  );
}
