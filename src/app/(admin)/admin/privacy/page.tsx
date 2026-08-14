import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { maskEmail } from "@/lib/privacy/anonymise";
import { PrivacyRequestTable } from "@/components/admin/PrivacyRequestTable";
import {
  GRIEVANCE_SLA_DAYS,
  PRIVACY_REQUEST_WARN_DAYS,
} from "@/lib/privacy/constants";

/**
 * The data-principal request queue.
 *
 * OWNER + ADMIN only — see the role note in actions/admin-privacy.ts.
 *
 * The rows deliberately carry a MASKED email and nothing else identifying: no
 * phone, no address, no order history. This queue is for triaging requests, not
 * for browsing customers, and a staff member who genuinely needs the underlying
 * record clicks through to /admin/users or /admin/orders — which is a separate,
 * separately-audited action. The obvious version of this page would `include:
 * { user: true }` and ship every column of the User row, passwordHash included,
 * into the browser.
 */
/**
 * Loads and shapes the queue.
 *
 * Separated from the component because it reads the clock: calling Date.now()
 * directly in a render body is impure and the React Compiler rejects it. Doing
 * the work here keeps the component a pure function of what this returns.
 */
async function loadQueue() {
  const requests = await prisma.privacyRequest.findMany({
    orderBy: [{ status: "asc" }, { requestedAt: "asc" }],
    take: 200,
    select: {
      id: true,
      type: true,
      status: true,
      note: true,
      resolution: true,
      requestedAt: true,
      scheduledFor: true,
      completedAt: true,
      contactEmail: true,
      userId: true,
      user: { select: { email: true, erasedAt: true } },
    },
  });

  const now = Date.now();
  return requests.map((r) => ({
    id: r.id,
    userId: r.userId,
    type: r.type,
    status: r.status,
    note: r.note,
    resolution: r.resolution,
    requestedAt: r.requestedAt.toISOString(),
    scheduledFor: r.scheduledFor?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    // Masked before it leaves the server, not in the component — a client-side
    // mask still ships the real address in the RSC payload.
    maskedEmail: maskEmail(r.user?.email ?? r.contactEmail ?? "unknown"),
    alreadyErased: Boolean(r.user?.erasedAt),
    ageDays: Math.floor((now - r.requestedAt.getTime()) / (1000 * 60 * 60 * 24)),
  }));
}

export default async function AdminPrivacyPage() {
  const session = await requireRole([...ADMIN_ROLES]);
  const rows = await loadQueue();

  const openCount = rows.filter(
    (r) => r.status === "PENDING" || r.status === "ON_HOLD" || r.status === "IN_PROGRESS"
  ).length;
  const overdueCount = rows.filter(
    (r) =>
      (r.status === "PENDING" || r.status === "ON_HOLD" || r.status === "IN_PROGRESS") &&
      r.ageDays >= PRIVACY_REQUEST_WARN_DAYS
  ).length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl text-foreground">Privacy Requests</h1>
        <p className="text-sm text-muted-foreground">
          Requests from customers about their personal data. We are committed to
          responding within {GRIEVANCE_SLA_DAYS} days — {openCount} open
          {overdueCount > 0 && (
            <span className="font-medium text-destructive">
              , {overdueCount} approaching the deadline
            </span>
          )}
          .
        </p>
        <p className="text-xs text-muted-foreground">
          Email addresses are shown partly hidden on purpose. If you need the
          full record, open the customer in Users or Orders.
        </p>
      </header>

      <PrivacyRequestTable
        rows={rows}
        isOwner={session.role === "OWNER"}
        warnDays={PRIVACY_REQUEST_WARN_DAYS}
      />
    </div>
  );
}
