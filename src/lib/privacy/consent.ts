import { prisma } from "@/lib/db";
import type { ConsentPurpose, ConsentRecord } from "@/generated/prisma/client";

/**
 * Reading the append-only ConsentRecord log.
 *
 * The table never updates a row: granting writes GRANTED, withdrawing writes
 * WITHDRAWN, and the current state is whichever landed last for that purpose.
 * Everything here exists so no caller has to remember that.
 */

/** The record shape the reducer needs. Kept structural so tests need no DB row. */
type ConsentLike = Pick<
  ConsentRecord,
  "purpose" | "status" | "grantedAt"
>;

/**
 * Newest record per purpose, from an arbitrarily ordered list.
 *
 * Pure so it can be unit-tested without a database — the ordering rule is the
 * part that would silently rot, not the query.
 */
export function resolveCurrentConsents<T extends ConsentLike>(
  records: T[]
): Partial<Record<ConsentPurpose, T>> {
  const latest: Partial<Record<ConsentPurpose, T>> = {};
  for (const record of records) {
    const current = latest[record.purpose];
    if (!current || record.grantedAt > current.grantedAt) {
      latest[record.purpose] = record;
    }
  }
  return latest;
}

/**
 * Whether consent currently stands for a purpose.
 *
 * Absence of any record means NO. Never default to granted: an account created
 * before a purpose existed has not agreed to it, and a missing row is the
 * normal representation of "never asked" — registerAction writes nothing when
 * the box is left unticked.
 */
export function isGranted<T extends ConsentLike>(
  records: T[],
  purpose: ConsentPurpose
): boolean {
  return resolveCurrentConsents(records)[purpose]?.status === "GRANTED";
}

export async function getCurrentConsents(
  userId: string
): Promise<Partial<Record<ConsentPurpose, ConsentRecord>>> {
  const records = await prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { grantedAt: "asc" },
  });
  return resolveCurrentConsents(records);
}

export async function hasConsent(
  userId: string,
  purpose: ConsentPurpose
): Promise<boolean> {
  const records = await prisma.consentRecord.findMany({
    where: { userId, purpose },
    orderBy: { grantedAt: "asc" },
  });
  return isGranted(records, purpose);
}

/** Full history, newest first — what the principal sees on /account/privacy. */
export async function getConsentHistory(
  userId: string
): Promise<ConsentRecord[]> {
  return prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { grantedAt: "desc" },
  });
}

// Labels live in ./labels.ts, which has no database import — this module does,
// and a client component importing a label string from here would pull the
// Postgres driver into the browser bundle.
