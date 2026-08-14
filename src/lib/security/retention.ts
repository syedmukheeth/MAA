import { prisma } from "@/lib/db";

/**
 * Security telemetry retention.
 *
 * Two years, not indefinite. Long enough that a slow-burn intrusion discovered
 * months later can still be reconstructed, and long enough to demonstrate the
 * monitoring obligation under DPDP §8(5) was met — but bounded, because a
 * security log is still processing and "we keep it forever in case" is the
 * position §8(7) exists to rule out.
 *
 * Everything here is already pseudonymous (keyed IP hash, user id), so this is
 * data minimisation on principle rather than to remedy an exposure.
 */
export const SECURITY_EVENT_RETENTION_DAYS = 730;

/** Safety valve, matching the erasure sweep — a huge backlog is purged over
 *  several nights rather than in one long-running transaction. */
const MAX_DELETE_PER_RUN = 5000;

export async function purgeExpiredSecurityEvents(): Promise<number> {
  const cutoff = new Date(
    Date.now() - SECURITY_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  // Select ids first, then delete by id. deleteMany with a date predicate can
  // take a wide lock on a large table; this keeps each statement bounded.
  const doomed = await prisma.securityEvent.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true },
    take: MAX_DELETE_PER_RUN,
  });

  if (doomed.length === 0) return 0;

  const { count } = await prisma.securityEvent.deleteMany({
    where: { id: { in: doomed.map((d) => d.id) } },
  });
  return count;
}
