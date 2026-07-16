import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";

/**
 * Owner-only, per ULTRAPLAN §2 ("Audit log (who changed what)" — Owner column).
 *
 * A log nobody can read is not a control, and a log the people it watches can
 * curate is not one either. There is deliberately no delete action here.
 */
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ACTION_TONE: Record<string, string> = {
  delete: "text-destructive",
  role_change: "text-gold",
  set_active: "text-gold",
  cancel: "text-destructive",
};

function toneFor(action: string): string {
  const match = Object.keys(ACTION_TONE).find((k) => action.includes(k));
  return match ? ACTION_TONE[match] : "text-muted-foreground";
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole(["OWNER"]);

  const { page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true, role: true } } },
    }),
    prisma.auditLog.count(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-heading text-2xl text-foreground">Audit Log</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every staff mutation, newest first. Entries cannot be edited or removed.
      </p>

      {entries.length === 0 ? (
        <p className="mt-10 rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Nothing recorded yet. Staff actions will appear here as they happen.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
                    {e.createdAt.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-foreground">{e.actor.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {e.actor.role}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 font-mono text-xs ${toneFor(e.action)}`}>
                    {e.action}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.summary ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center gap-2">
          {Array.from({ length: Math.min(totalPages, 12) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={p > 1 ? `/admin/audit?page=${p}` : "/admin/audit"}
              aria-current={p === currentPage ? "page" : undefined}
              className={`min-w-9 rounded-md border px-2.5 py-1 text-center text-xs ${
                p === currentPage
                  ? "border-bronze bg-bronze text-ivory"
                  : "border-border text-muted-foreground hover:border-bronze/50"
              }`}
            >
              {p}
            </a>
          ))}
        </nav>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        {total} {total === 1 ? "entry" : "entries"}
      </p>
    </div>
  );
}
