import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Prisma, SecurityEvent as SecurityEventRow } from "@/generated/prisma/client";
import type {
  SecurityEventType,
  SecuritySeverity,
} from "@/generated/prisma/enums";

/**
 * Breach detection.
 *
 * The application had good forensics (AuditLog answers "who did what") and no
 * detection at all — discovery depended on somebody noticing. DPDP §8(6)
 * requires notifying the Board and every affected principal after a breach,
 * with no materiality threshold, so "we found out three weeks later from a
 * customer" is not a survivable position.
 *
 * Two rules govern everything here:
 *
 *  1. **The security log must not become the next breach.** It stores a keyed
 *     hash of the client IP, never the address; a user id, never an email. A
 *     monitoring table full of personal data is a bigger liability than the
 *     problem it detects.
 *
 *  2. **Writes are best-effort**, exactly like recordAudit. A detection failure
 *     must never break the request it was observing — a missing log line is
 *     bad, a login that 500s because telemetry is down is worse.
 */

/** Severity per event type. Only HIGH and CRITICAL page anyone. */
export const EVENT_SEVERITY: Record<SecurityEventType, SecuritySeverity> = {
  // Individually meaningless — one person mistyping a password. The value is
  // in the aggregate, which the detectors below turn into a real signal.
  LOGIN_FAILED: "INFO",
  // Someone is working through a password list against one account.
  CREDENTIAL_STUFFING_SUSPECTED: "HIGH",
  // One source, many different accounts. The per-account limiter never sees it.
  PASSWORD_SPRAYING_SUSPECTED: "HIGH",
  // The strongest single indicator of an actual takeover.
  LOGIN_SUCCESS_AFTER_FAILURES: "CRITICAL",
  // Someone now has staff or owner access who did not before.
  PRIVILEGE_ESCALATION: "HIGH",
  STAFF_ACCESS_CHANGED: "MEDIUM",
  // One is a stale bookmark. A run of them is someone trying doors.
  UNAUTHORISED_ACCESS_ATTEMPT: "LOW",
  // The erasure endpoint is the one route that can destroy data in bulk.
  CRON_AUTH_FAILED: "HIGH",
  BULK_DATA_EXPORT: "MEDIUM",
  // Not an attack. Recorded because it is irreversible and must be accountable.
  ERASURE_EXECUTED: "INFO",
};

const SEVERITY_RANK: Record<SecuritySeverity, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/** Pure. Whether a severity clears the bar for waking someone up. */
export function isAlertable(severity: SecuritySeverity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK.HIGH;
}

export function compareSeverity(
  a: SecuritySeverity,
  b: SecuritySeverity
): number {
  return SEVERITY_RANK[a] - SEVERITY_RANK[b];
}

/**
 * Keyed, truncated hash of a client IP.
 *
 * Correlation without retention: we can say "the same source failed against 40
 * accounts" without ever storing anyone's address. Keyed rather than a bare
 * SHA-256 because the IPv4 space is small enough to enumerate exhaustively — an
 * unkeyed hash of an IP is reversible in seconds and would be personal data
 * wearing a disguise.
 *
 * Derived from JWT_SECRET rather than needing its own variable. The consequence
 * is that rotating JWT_SECRET makes historical hashes uncorrelatable with new
 * ones, which is acceptable: rotation already signs everyone out, and old
 * security events keep their summaries and counts.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  const key = process.env.JWT_SECRET;
  // Fail closed to null rather than falling back to an unkeyed hash, which
  // would silently start storing reversible IP addresses.
  if (!key) return null;
  return createHmac("sha256", key).update(ip).digest("hex").slice(0, 32);
}

export type SecurityEventInput = {
  type: SecurityEventType;
  /** Omit to use the default severity for the type. */
  severity?: SecuritySeverity;
  /** Raw IP — hashed here so no caller has to remember to. */
  ip?: string | null;
  userId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Records one security event and returns it, or null if the write failed.
 *
 * Callers should not await this on the critical path where latency matters —
 * but they must not let it throw either, hence the swallow.
 */
export async function recordSecurityEvent(input: SecurityEventInput) {
  const severity = input.severity ?? EVENT_SEVERITY[input.type];
  try {
    return await prisma.securityEvent.create({
      data: {
        type: input.type,
        severity,
        ipHash: hashIp(input.ip),
        userId: input.userId ?? null,
        summary: input.summary,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    // Deliberately swallowed. No identifiers in the fallback log line — this
    // runs when the database is already unhappy, and Vercel's log store has its
    // own retention we do not control.
    console.error(
      `SECURITY EVENT WRITE FAILED [${input.type}] [${err instanceof Error ? err.name : "unknown"}]`
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

/** Failures against one account within this window trip the stuffing detector. */
export const STUFFING_WINDOW_MINUTES = 15;
export const STUFFING_THRESHOLD = 6;

/** Distinct accounts one source may fail against before it looks like spraying. */
export const SPRAYING_WINDOW_MINUTES = 30;
export const SPRAYING_THRESHOLD = 5;

/** Failures that make a subsequent success look like a takeover. */
export const TAKEOVER_LOOKBACK_MINUTES = 30;
export const TAKEOVER_THRESHOLD = 5;

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

/**
 * Records a failed login and escalates if the pattern warrants it.
 *
 * Takes `userId` as null when the address matched no account — that is still
 * worth counting for the spraying detector, and it is why SecurityEvent.userId
 * has no foreign key.
 */
export async function recordFailedLogin(params: {
  ip: string | null;
  userId: string | null;
}): Promise<SecurityEventRow[]> {
  const escalations: SecurityEventRow[] = [];

  await recordSecurityEvent({
    type: "LOGIN_FAILED",
    ip: params.ip,
    userId: params.userId,
    summary: params.userId
      ? "Failed password attempt against an existing account"
      : "Failed login for an address with no account",
  });

  const ipHash = hashIp(params.ip);

  // Credential stuffing: many failures, one account.
  if (params.userId) {
    const recent = await prisma.securityEvent.count({
      where: {
        type: "LOGIN_FAILED",
        userId: params.userId,
        createdAt: { gte: minutesAgo(STUFFING_WINDOW_MINUTES) },
      },
    });
    if (recent >= STUFFING_THRESHOLD) {
      const event = await recordSecurityEvent({
        type: "CREDENTIAL_STUFFING_SUSPECTED",
        ip: params.ip,
        userId: params.userId,
        summary: `${recent} failed logins against one account in ${STUFFING_WINDOW_MINUTES} minutes`,
        metadata: { failures: recent, windowMinutes: STUFFING_WINDOW_MINUTES },
      });
      if (event) escalations.push(event);
    }
  }

  // Password spraying: one source, many DIFFERENT accounts. Counted by distinct
  // userId, not by volume — ten attempts at one account is stuffing, one
  // attempt at ten accounts is spraying, and they need different responses.
  if (ipHash) {
    const distinct = await prisma.securityEvent.findMany({
      where: {
        type: "LOGIN_FAILED",
        ipHash,
        createdAt: { gte: minutesAgo(SPRAYING_WINDOW_MINUTES) },
        userId: { not: null },
      },
      select: { userId: true },
      distinct: ["userId"],
      take: SPRAYING_THRESHOLD + 1,
    });
    if (distinct.length >= SPRAYING_THRESHOLD) {
      const event = await recordSecurityEvent({
        type: "PASSWORD_SPRAYING_SUSPECTED",
        ip: params.ip,
        summary: `One source failed against ${distinct.length} different accounts in ${SPRAYING_WINDOW_MINUTES} minutes`,
        metadata: {
          distinctAccounts: distinct.length,
          windowMinutes: SPRAYING_WINDOW_MINUTES,
        },
      });
      if (event) escalations.push(event);
    }
  }

  return escalations;
}

/**
 * Called after a SUCCESSFUL login. Flags the case that matters most: the
 * password was finally guessed.
 */
export async function checkSuspiciousLoginSuccess(params: {
  ip: string | null;
  userId: string;
}): Promise<SecurityEventRow[]> {
  const failures = await prisma.securityEvent.count({
    where: {
      type: "LOGIN_FAILED",
      userId: params.userId,
      createdAt: { gte: minutesAgo(TAKEOVER_LOOKBACK_MINUTES) },
    },
  });

  if (failures < TAKEOVER_THRESHOLD) return [];

  const event = await recordSecurityEvent({
    type: "LOGIN_SUCCESS_AFTER_FAILURES",
    ip: params.ip,
    userId: params.userId,
    summary: `Successful sign-in after ${failures} failed attempts in ${TAKEOVER_LOOKBACK_MINUTES} minutes — possible account takeover`,
    metadata: { precedingFailures: failures },
  });

  return event ? [event] : [];
}
