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
  | "combo.create"
  | "combo.update"
  | "combo.delete"
  | "combo.toggle_active"
  | "inventory.receive"
  | "inventory.adjust"
  | "order.status_change"
  | "order.cancel"
  | "request.status_change"
  | "settings.update"
  | "user.role_change"
  | "user.set_active"
  | "testimonial.create"
  | "testimonial.update"
  | "testimonial.delete";

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
    // Deliberately swallowed — see design notes above.
    console.error(`AUDIT WRITE FAILED [${input.action}] by ${input.actorId}:`, err);
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
