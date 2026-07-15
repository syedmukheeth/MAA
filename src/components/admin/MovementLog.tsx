export type MovementRow = {
  id: string;
  productName: string;
  variantName: string;
  type: string;
  qty: number;
  reason: string | null;
  orderId: string | null;
  byUser: string;
  createdAt: string;
};

const TYPE_STYLES: Record<string, string> = {
  RECEIVED: "bg-emerald-500/15 text-emerald-500",
  SOLD: "bg-sky-500/15 text-sky-500",
  RETURNED: "bg-violet-500/15 text-violet-500",
  DAMAGED: "bg-destructive/15 text-destructive",
  ADJUSTMENT: "bg-amber-500/15 text-amber-500",
};

export function MovementLog({ movements }: { movements: MovementRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {movements.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {new Date(m.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-4 py-3 text-foreground">
                {m.productName}
                <span className="ml-2 text-xs text-muted-foreground">
                  {m.variantName}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    TYPE_STYLES[m.type] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.type}
                </span>
              </td>
              <td
                className={`px-4 py-3 tabular-nums ${
                  m.qty > 0 ? "text-emerald-500" : "text-destructive"
                }`}
              >
                {m.qty > 0 ? `+${m.qty}` : m.qty}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {m.reason ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{m.byUser}</td>
            </tr>
          ))}
          {movements.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No stock movements yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
