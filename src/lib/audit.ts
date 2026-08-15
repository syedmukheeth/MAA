import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Who changed what.
 *
 * Required by ULTRAPLAN §2 and previously absent entirely: nothing recorded who
 * altered a price, deleted a product, cancelled an order, or granted a role.
 * With three staff tiers touching money and stock, this is the primary internal
 * control — and the reason the self-promotion hole in users.ts was, until it was
 * fixed, completely unattributable after the fact.
 *
 * Design notes:
 *  - Writes are best-effort. An audit failure must never roll back the business
 *    action the user asked for; a missing log line is bad, a failed order is
 *    worse. Failures are logged loudly instead.
 *  - Pass `tx` when the caller is already inside a transaction, so the log lands
 *    or rolls back with the change it describes.
 *  - Never put secrets, password hashes, or tokens in `metadata`.
 */
export type AuditAction =
  | "product.create"
  | "product.update"
  | "product.delete"
  | "product.activate"
  | "product.deactivate"
  | "combo.create"
  | "combo.update"
  | "combo.delete"
  | "combo.toggle_active"
  | "inventory.receive"
  | "inventory.adjust"
  | "order.status_change"
  | "order.created"
  | "order.email_failed"
  | "order.cancel"
  | "order.refund"
  | "request.status_change"
  | "settings.update"
  | "user.role_change"
  | "user.set_active"
  | "user.password_change"
  | "testimonial.create"
  | "testimonial.update"
  | "testimonial.delete"
  // DPDP. These record that a right was exercised and honoured — the trail a
  // fiduciary needs to show it responded, without re-recording the personal
  // data the request was about.
  | "privacy.consent_grant"
  | "privacy.consent_withdraw"
  | "privacy.export"
  | "privacy.correction"
  | "privacy.erasure_request"
  | "privacy.erasure_blocked"
  | "privacy.erasure_cancel"
  | "privacy.erasure_complete"
  | "privacy.erasure_purge_failed"
  | "privacy.grievance"
  | "privacy.request_status_change";

type Client = Pick<typeof prisma, "auditLog"> | Prisma.TransactionClient;

export async function recordAudit(
  input: {
    actorId: string;
    action: AuditAction;
    entity: string;
    entityId?: string | null;
    summary?: string;
    metadata?: Prisma.InputJsonValue;
  },
  tx?: Client
): Promise<void> {
  const client = tx ?? prisma;
  try {
    await client.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    // Deliberately swallowed — see design notes above. The actor id is left out
    // on purpose: this line lands in Vercel's log store, which has its own
    // retention, and `action` alone is enough to diagnose a failing write.
    console.error(`AUDIT WRITE FAILED [${input.action}]:`, err);
  }
}

/**
 * Compact before/after for metadata. Only records fields that actually moved.
 *
 * Values are stringified, not passed through raw: `metadata` is a JSONB column,
 * and Prisma's Decimal and JS Date do not survive JSON serialisation. Stringify
 * here or the audit write throws at runtime on the one field you cared about.
 */
export function diff<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>
): Record<string, { from: string; to: string }> {
  const out: Record<string, { from: string; to: string }> = {};
  for (const key of Object.keys(after)) {
    const from = String(before[key] ?? "");
    const to = String(after[key] ?? "");
    if (from !== to) out[key] = { from, to };
  }
  return out;
}
