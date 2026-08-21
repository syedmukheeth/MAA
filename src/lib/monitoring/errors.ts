import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import { errorAlertHtml } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { GRIEVANCE_OFFICER } from "@/lib/privacy/constants";
import type { ErrorSource } from "@/generated/prisma/enums";
import { fingerprint, scrubMessage, scrubRoute, scrubStack } from "./scrub";

/**
 * Error capture.
 *
 * Grouped by fingerprint, so an error firing ten thousand times is one row with
 * a count. A per-occurrence table becomes unreadable exactly when something is
 * badly broken — the moment it most needs to be readable.
 *
 * Everything is scrubbed before storage (see scrub.ts). The errors most worth
 * capturing are the ones carrying personal data: a Prisma failure in placeOrder
 * has the customer's name, phone and address interpolated into its message.
 *
 * Writes are best-effort. An error-reporting failure must never replace the
 * error it was reporting.
 */

/** One alert per distinct error per hour. */
const ALERT_THROTTLE_SECONDS = 3600;

/** Occurrences within the throttle window that make a known error worth re-raising. */
const SPIKE_THRESHOLD = 50;

export type CaptureInput = {
  source: ErrorSource;
  error: unknown;
  route?: string | null;
};

function normalise(error: unknown): {
  name: string;
  message: string;
  stack: string | null;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }
  // Thrown strings and objects are rare but real, usually from a library.
  return {
    name: "NonError",
    message: typeof error === "string" ? error : JSON.stringify(error),
    stack: null,
  };
}

/**
 * Records one error occurrence and alerts when it warrants attention.
 *
 * Returns nothing and never throws.
 */
export async function captureError(input: CaptureInput): Promise<void> {
  try {
    const raw = normalise(input.error);

    // Next.js re-throws redirect() and notFound() as exceptions. They are
    // control flow, not failures, and capturing them would bury real errors
    // under thousands of routine navigations.
    if (isFrameworkControlFlow(raw)) return;

    const message = scrubMessage(raw.message);
    const stack = scrubStack(raw.stack);
    const route = scrubRoute(input.route);
    const fp = fingerprint(raw);

    const now = new Date();
    const record = await prisma.errorEvent.upsert({
      where: { fingerprint: fp },
      create: {
        fingerprint: fp,
        source: input.source,
        name: raw.name,
        message,
        stack,
        route,
      },
      update: {
        occurrences: { increment: 1 },
        lastSeenAt: now,
        // A recurrence reopens something previously marked fixed — that is the
        // single most useful thing this table can tell you.
        resolvedAt: null,
        // Keep the most recent route; a bug can surface on several pages and
        // the latest is the one someone is looking at now.
        route,
        // Refresh the stored text on every occurrence, even though the
        // fingerprint is unchanged.
        //
        // Two reasons, both learned the hard way. The fingerprint is a hash of
        // the SCRUBBED message, so improving the scrubber does not change it —
        // meaning a row written before a redaction rule existed would keep its
        // unredacted text forever, and the fix would silently not apply to the
        // very rows that motivated it. And the latest occurrence is the more
        // useful sample anyway.
        message,
        stack,
        name: raw.name,
      },
    });

    const isNew = record.occurrences === 1;

    await maybeAlertError(record.fingerprint, {
      isNew,
      name: raw.name,
      message,
      route,
      source: input.source,
      occurrences: record.occurrences,
    });
  } catch (err) {
    // Last resort. No identifiers, and no rethrow — this path runs when the
    // database is already unhappy.
    console.error(
      `ERROR CAPTURE FAILED [${err instanceof Error ? err.name : "unknown"}]`
    );
  }
}

/**
 * Next.js signals redirect() and notFound() by throwing. Both are normal.
 */
function isFrameworkControlFlow(raw: { message: string }): boolean {
  return (
    raw.message.includes("NEXT_REDIRECT") ||
    raw.message.includes("NEXT_NOT_FOUND") ||
    raw.message.includes("NEXT_HTTP_ERROR_FALLBACK")
  );
}

/**
 * Claims a once-per-hour slot. Fails OPEN — if Redis is unreachable we would
 * rather send a duplicate alert than go quiet about a broken site.
 */
async function claimHourly(key: string): Promise<boolean> {
  try {
    const result = await redis.set(key, Date.now(), {
      nx: true,
      ex: ALERT_THROTTLE_SECONDS,
    });
    return result === "OK";
  } catch {
    return true;
  }
}

/**
 * Alerts on a genuinely new error, or on a known one spiking.
 *
 * Fails open like the security alerts: a duplicate email beats silence about a
 * site that is broken for everyone.
 */
async function maybeAlertError(
  fp: string,
  detail: {
    isNew: boolean;
    name: string;
    message: string;
    route: string | null;
    source: ErrorSource;
    occurrences: number;
  }
): Promise<void> {
  const worthAlerting =
    detail.isNew || detail.occurrences % SPIKE_THRESHOLD === 0;
  if (!worthAlerting) return;

  let claimed = true;
  try {
    claimed = await claimHourly(`error-alert:${fp}`);
  } catch {
    claimed = true;
  }
  if (!claimed) return;

  // Browser-reported errors carry an attacker-chosen message, and the message is
  // what the fingerprint hashes — so varying it defeats the per-fingerprint
  // throttle above and turns reportClientError into an email amplifier aimed at
  // the grievance officer. One CLIENT alert per hour, whatever the message; the
  // rows are still written and the /admin/monitoring dashboard shows all of them.
  if (detail.source === "CLIENT" && !(await claimHourly("error-alert-source:CLIENT"))) {
    return;
  }

  const sent = await sendEmail({
    to: GRIEVANCE_OFFICER.email,
    subject: `[${detail.isNew ? "New" : "Recurring"} error] ${detail.name}`,
    html: errorAlertHtml({
      isNew: detail.isNew,
      name: detail.name,
      message: detail.message,
      route: detail.route,
      source: detail.source,
      occurrences: detail.occurrences,
      dashboardUrl: `${getSiteUrl()}/admin/monitoring`,
    }),
  });

  if (sent) {
    await prisma.errorEvent
      .update({ where: { fingerprint: fp }, data: { alertedAt: new Date() } })
      .catch(() => {});
  }
}

/** Retention for resolved, quiet errors. Open ones are never auto-purged. */
export const ERROR_RETENTION_DAYS = 90;

export async function purgeOldErrors(): Promise<number> {
  const cutoff = new Date(Date.now() - ERROR_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.errorEvent.deleteMany({
    where: { lastSeenAt: { lt: cutoff } },
  });
  return count;
}
