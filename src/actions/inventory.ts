"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { applyStockMovement } from "@/lib/inventory";
import { recordAudit } from "@/lib/audit";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

function revalidateInventoryPaths() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function receiveStock(input: {
  variantId: string;
  qty: number;
  reason?: string;
}): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const qty = Math.trunc(input.qty);
  if (!Number.isFinite(qty) || qty <= 0) {
    return { error: "Quantity must be a positive number" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const reason = input.reason?.trim() || "Stock received";
      await applyStockMovement(tx, {
        variantId: input.variantId,
        type: "RECEIVED",
        qty,
        reason,
        byUserId: session.sub,
      });
      await recordAudit(
        {
          actorId: session.sub,
          action: "inventory.receive",
          entity: "Variant",
          entityId: input.variantId,
          summary: `Received ${qty} units`,
          metadata: { qty, reason },
        },
        tx
      );
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not receive stock",
    };
  }

  revalidateInventoryPaths();
  return {};
}

export async function adjustStock(input: {
  variantId: string;
  delta: number;
  reason: string;
  damaged?: boolean;
}): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const delta = Math.trunc(input.delta);
  if (!Number.isFinite(delta) || delta === 0) {
    return { error: "Adjustment cannot be zero" };
  }
  const reason = input.reason?.trim();
  if (!reason) {
    return { error: "A reason is required for adjustments" };
  }
  if (input.damaged && delta > 0) {
    return { error: "Damaged stock must be a negative adjustment" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await applyStockMovement(tx, {
        variantId: input.variantId,
        type: input.damaged ? "DAMAGED" : "ADJUSTMENT",
        qty: delta,
        reason,
        byUserId: session.sub,
      });
      await recordAudit(
        {
          actorId: session.sub,
          action: "inventory.adjust",
          entity: "Variant",
          entityId: input.variantId,
          summary: `${delta > 0 ? "+" : ""}${delta} units — ${reason}`,
          metadata: { delta, reason, damaged: Boolean(input.damaged) },
        },
        tx
      );
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not adjust stock",
    };
  }

  revalidateInventoryPaths();
  return {};
}
