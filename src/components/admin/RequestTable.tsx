import Link from "next/link";
import { REQUEST_STATUS_LABELS } from "@/lib/validations/custom-request";

export type RequestRow = {
  id: string;
  name: string;
  phone: string;
  budgetRange: string | null;
  status: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-sky-500/15 text-sky-500",
  IN_REVIEW: "bg-amber-500/15 text-amber-500",
  QUOTED: "bg-indigo-500/15 text-indigo-400",
  CONVERTED: "bg-emerald-500/15 text-emerald-500",
  CLOSED: "bg-muted text-muted-foreground",
};

export function RequestTable({ requests }: { requests: RequestRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Budget</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requests.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/requests/${r.id}`}
                  className="text-foreground hover:text-bronze"
                >
                  {r.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{r.phone}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {r.budgetRange ?? "-"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {REQUEST_STATUS_LABELS[
                    r.status as keyof typeof REQUEST_STATUS_LABELS
                  ] ?? r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{r.createdAt}</td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                No custom furniture requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
