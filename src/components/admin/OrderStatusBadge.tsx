const COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500",
  CONFIRMED: "bg-sky-500/15 text-sky-500",
  PACKED: "bg-indigo-500/15 text-indigo-400",
  SHIPPED: "bg-violet-500/15 text-violet-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-500",
  CANCELLED: "bg-red-500/15 text-red-500",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        COLORS[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}
