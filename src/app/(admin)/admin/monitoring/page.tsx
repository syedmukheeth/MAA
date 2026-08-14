import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { readHeartbeat, HEARTBEAT_STALE_AFTER_HOURS } from "@/lib/monitoring/heartbeat";
import { ERROR_RETENTION_DAYS } from "@/lib/monitoring/errors";
import { ErrorEventTable } from "@/components/admin/ErrorEventTable";

/**
 * Application health and error tracking.
 *
 * OWNER and ADMIN — unlike the security timeline, this is operational rather
 * than a control over staff behaviour, and whoever is fixing the site needs to
 * see what is broken.
 *
 * Error messages here are already scrubbed of personal data at capture time
 * (src/lib/monitoring/scrub.ts), which is why they can be displayed in full.
 */
async function loadMonitoring() {
  const now = Date.now();

  const [open, resolved, heartbeat, dbOk] = await Promise.all([
    prisma.errorEvent.findMany({
      where: { resolvedAt: null },
      orderBy: { lastSeenAt: "desc" },
      take: 100,
    }),
    prisma.errorEvent.count({ where: { resolvedAt: { not: null } } }),
    readHeartbeat(),
    prisma
      .$queryRaw`SELECT 1`.then(() => true)
      .catch(() => false),
  ]);

  return {
    heartbeat,
    dbOk,
    resolvedCount: resolved,
    errors: open.map((e) => ({
      fingerprint: e.fingerprint,
      name: e.name,
      message: e.message,
      route: e.route,
      stack: e.stack,
      source: e.source,
      occurrences: e.occurrences,
      firstSeen: e.firstSeenAt.toISOString(),
      lastSeen: e.lastSeenAt.toISOString(),
      hoursSinceLast: Math.floor((now - e.lastSeenAt.getTime()) / 3_600_000),
      alerted: e.alertedAt !== null,
    })),
  };
}

export default async function AdminMonitoringPage() {
  await requireRole([...ADMIN_ROLES]);
  const { heartbeat, dbOk, errors, resolvedCount } = await loadMonitoring();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl text-foreground">Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Application errors and system health. Personal data is stripped from
          error text before it is stored, so nothing here identifies a customer.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatusCard
          label="Database"
          state={dbOk ? "ok" : "error"}
          detail={dbOk ? "Responding" : "Not reachable"}
        />
        <StatusCard
          label="Scheduled jobs"
          state={
            heartbeat.state === "ok"
              ? "ok"
              : heartbeat.state === "unknown"
                ? "warn"
                : "error"
          }
          detail={
            heartbeat.state === "ok"
              ? `Last ran ${heartbeat.hoursSince}h ago`
              : heartbeat.state === "stale"
                ? `Last ran ${heartbeat.hoursSince}h ago — expected within ${HEARTBEAT_STALE_AFTER_HOURS}h`
                : heartbeat.state === "never"
                  ? "Has never run — check CRON_SECRET"
                  : "Cannot tell (cache unreachable)"
          }
        />
        <StatusCard
          label="Open errors"
          state={errors.length === 0 ? "ok" : "warn"}
          detail={
            errors.length === 0
              ? "None"
              : `${errors.length} open · ${resolvedCount} resolved`
          }
        />
      </section>

      {heartbeat.state !== "ok" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <strong className="text-destructive">
            Scheduled jobs are not running.
          </strong>{" "}
          Account deletions customers have requested are queued but not being
          carried out. The usual cause is an unset <code>CRON_SECRET</code>, which
          makes the job reject its own scheduler. Check{" "}
          <code>/admin/privacy</code> for the queue.
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg text-foreground">Errors</h2>
        <ErrorEventTable errors={errors} />
        <p className="text-xs text-muted-foreground">
          Errors are grouped — one row per distinct fault, with a count. Rows
          untouched for {ERROR_RETENTION_DAYS} days are removed by the nightly
          job. Marking one resolved does not delete it; if it happens again it
          reopens itself.
        </p>
      </section>

      <p className="text-xs text-muted-foreground">
        This page cannot tell you the site is down — if it were, this page would
        not load either. Point an external uptime checker at{" "}
        <code>/api/health</code> and alert on a 503 or on a body containing
        &quot;degraded&quot;. See <code>docs/privacy/11-monitoring.md</code>.
      </p>
    </div>
  );
}

function StatusCard({
  label,
  state,
  detail,
}: {
  label: string;
  state: "ok" | "warn" | "error";
  detail: string;
}) {
  const styles = {
    ok: "border-border bg-card",
    warn: "border-amber-500/40 bg-amber-500/5",
    error: "border-destructive/40 bg-destructive/5",
  }[state];

  const dot = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    error: "bg-destructive",
  }[state];

  return (
    <div className={`rounded-lg border p-4 ${styles}`}>
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground">{detail}</p>
    </div>
  );
}
