import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { SecurityEventTable } from "@/components/admin/SecurityEventTable";
import { SECURITY_EVENT_RETENTION_DAYS } from "@/lib/security/retention";

/**
 * The security timeline.
 *
 * OWNER only, matching the audit log — a record of attempts against the system
 * is not something the people it watches should be able to curate, and the
 * privilege-escalation events here are precisely the ones an attacker with
 * staff access would want to delete.
 *
 * Rows carry no personal data by construction: SecurityEvent stores a keyed IP
 * hash and a user id, never an address or an email. The hash is shown truncated
 * purely so one source can be visually correlated across rows.
 */
async function loadEvents() {
  const now = Date.now();

  const [events, counts] = await Promise.all([
    prisma.securityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        type: true,
        severity: true,
        summary: true,
        ipHash: true,
        userId: true,
        alertedAt: true,
        createdAt: true,
      },
    }),
    prisma.securityEvent.groupBy({
      by: ["severity"],
      _count: { _all: true },
      where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      severity: e.severity,
      summary: e.summary,
      // Eight characters is enough to spot "the same source again" without
      // being a useful input to anything else.
      source: e.ipHash ? e.ipHash.slice(0, 8) : null,
      userId: e.userId,
      alerted: e.alertedAt !== null,
      at: e.createdAt.toISOString(),
      ageHours: Math.floor((now - e.createdAt.getTime()) / 3_600_000),
    })),
    weekly: Object.fromEntries(
      counts.map((c) => [c.severity, c._count._all])
    ) as Record<string, number>,
  };
}

export default async function AdminSecurityPage() {
  await requireRole(["OWNER"]);
  const { events, weekly } = await loadEvents();

  const urgent = (weekly.CRITICAL ?? 0) + (weekly.HIGH ?? 0);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl text-foreground">Security</h1>
        <p className="text-sm text-muted-foreground">
          Sign-in anomalies, permission changes and access attempts. In the last
          7 days:{" "}
          {urgent > 0 ? (
            <span className="font-medium text-destructive">
              {urgent} needing attention
            </span>
          ) : (
            <span>nothing needing attention</span>
          )}
          {" · "}
          {weekly.MEDIUM ?? 0} medium · {weekly.LOW ?? 0} low ·{" "}
          {weekly.INFO ?? 0} informational.
        </p>
        <p className="text-xs text-muted-foreground">
          Sources are shown as a short hash, not an IP address — enough to spot
          the same origin twice, not enough to identify anyone. Events are kept
          for {SECURITY_EVENT_RETENTION_DAYS} days.
        </p>
      </header>

      <SecurityEventTable events={events} />

      <p className="text-xs text-muted-foreground">
        If any of this turns out to be a personal data breach, DPDP section 8(6)
        requires notifying the Data Protection Board of India and every affected
        person. The runbook is in <code>docs/privacy/08-breach-response.md</code>.
      </p>
    </div>
  );
}
