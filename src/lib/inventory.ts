import type { Prisma, StockMovementType } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Movement types that must carry positive qty (stock in). */
const INBOUND: StockMovementType[] = ["RECEIVED", "RETURNED"];
/** Movement types that must carry negative qty (stock out). */
const OUTBOUND: StockMovementType[] = ["SOLD", "DAMAGED"];

export type StockMovementInput = {
  variantId: string;
  type: StockMovementType;
  /** Signed quantity: positive adds stock, negative removes it. */
  qty: number;
  reason?: string;
  orderId?: string;
  byUserId?: string;
};

/**
 * The ONLY way stock changes. Writes the ledger row and updates
 * Variant.stock atomically, then keeps Product.stockQuantity in sync
 * as a derived aggregate. Must run inside a transaction.
 */
export async function applyStockMovement(
  tx: Tx,
  input: StockMovementInput
): Promise<void> {
  const qty = Math.trunc(input.qty);
  if (qty === 0 || !Number.isFinite(qty)) {
    throw new Error("Stock movement quantity cannot be zero");
  }
  if (INBOUND.includes(input.type) && qty < 0) {
    throw new Error(`${input.type} movements must add stock`);
  }
  if (OUTBOUND.includes(input.type) && qty > 0) {
    throw new Error(`${input.type} movements must remove stock`);
  }

  const variant = await tx.variant.update({
    where: { id: input.variantId },
    data: { stock: { increment: qty } },
    select: { stock: true, productId: true, name: true },
  });
  if (variant.stock < 0) {
    throw new Error("Insufficient stock");
  }

  await tx.stockMovement.create({
    data: {
      variantId: input.variantId,
      type: input.type,
      qty,
      reason: input.reason,
      orderId: input.orderId,
      byUserId: input.byUserId,
    },
  });

  await recomputeProductStock(tx, variant.productId);
}

/** Recompute Product.stockQuantity as the sum of its variants' stock. */
export async function recomputeProductStock(
  tx: Tx,
  productId: string
): Promise<void> {
  const agg = await tx.variant.aggregate({
    where: { productId },
    _sum: { stock: true },
  });
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: agg._sum.stock ?? 0 },
  });
}

/** Default variant of a product (combos consume default variants). */
export async function getDefaultVariant(tx: Tx, productId: string) {
  const variant =
    (await tx.variant.findFirst({
      where: { productId, isDefault: true },
    })) ??
    (await tx.variant.findFirst({
      where: { productId },
      orderBy: { createdAt: "asc" },
    }));
  if (!variant) {
    throw new Error("Product has no variants configured");
  }
  return variant;
}

type OrderItemForRestock = {
  variantId: string | null;
  productId: string | null;
  comboId: string | null;
  quantity: number;
};

/**
 * Restores stock for a cancelled order with RETURNED movements.
 * Shared by customer self-cancel and staff cancellation.
 *
 * Reverses the order's actual SOLD ledger rows rather than re-deriving from
 * the combo definition — combo items can carry customer-chosen variants (not
 * the default), and the combo itself may have been edited since purchase.
 */
export async function restockOrderItems(
  tx: Tx,
  order: { id: string; items: OrderItemForRestock[] },
  byUserId?: string
): Promise<void> {
  const sold = await tx.stockMovement.findMany({
    where: { orderId: order.id, type: "SOLD" },
    select: { variantId: true, qty: true },
  });

  if (sold.length > 0) {
    for (const movement of sold) {
      await applyStockMovement(tx, {
        variantId: movement.variantId,
        type: "RETURNED",
        qty: -movement.qty,
        reason: "Order cancelled",
        orderId: order.id,
        byUserId,
      });
    }
    return;
  }

  // Fallback for legacy orders that predate per-order SOLD ledger rows.
  for (const item of order.items) {
    if (item.variantId) {
      await applyStockMovement(tx, {
        variantId: item.variantId,
        type: "RETURNED",
        qty: item.quantity,
        reason: "Order cancelled",
        orderId: order.id,
        byUserId,
      });
    } else if (item.comboId) {
      const combo = await tx.combo.findUnique({
        where: { id: item.comboId },
        include: { items: true },
      });
      if (!combo) continue;
      for (const comboItem of combo.items) {
        const variant = await getDefaultVariant(tx, comboItem.productId);
        await applyStockMovement(tx, {
          variantId: variant.id,
          type: "RETURNED",
          qty: comboItem.quantity * item.quantity,
          reason: "Order cancelled (combo)",
          orderId: order.id,
          byUserId,
        });
      }
    }
  }
}
