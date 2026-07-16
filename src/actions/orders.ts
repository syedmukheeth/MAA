"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, getCurrentUser } from "@/lib/auth/session";
import {
  shippingAddressSchema,
  type ShippingAddressInput,
} from "@/lib/validations/checkout";
import {
  applyStockMovement,
  getDefaultVariant,
  restockOrderItems,
} from "@/lib/inventory";
import { sendEmail } from "@/lib/email";
import { orderConfirmationHtml, orderStatusUpdateHtml } from "@/lib/email-templates";
import { getSiteSettings } from "@/lib/site-settings";
import { money, toPaise, type Money } from "@/lib/money";
import { computeCartTotals } from "@/lib/cart";
import { recordAudit } from "@/lib/audit";
import { randomBytes } from "node:crypto";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Order numbers must be unique, and `orderNumber` carries a UNIQUE constraint.
 *
 * The previous `MAA-${Date.now()}` collided whenever two orders landed in the
 * same millisecond — and the loser wasn't a retry, it was a customer whose
 * entire checkout transaction rolled back with a constraint violation. Rare,
 * but it fails at exactly the worst moment: peak traffic.
 *
 * Timestamp keeps them roughly sortable; the random suffix removes the race.
 */
function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `MAA-${stamp}-${rand}`;
}

export async function placeOrder(
  input: ShippingAddressInput
): Promise<{ error?: string; orderId?: string }> {
  const session = await requireAuth();
  const parsed = shippingAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address" };
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
          combo: { include: { items: { include: { product: true } } } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty" };
  }

  // Read outside the transaction: settings are slow-changing config, and the
  // rate is frozen onto the order below so a later change can't rewrite it.
  const settings = await getSiteSettings();

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      // Aggregate required stock per variant
      const required = new Map<string, { name: string; needed: number }>();
      const addRequired = (variantId: string, name: string, qty: number) => {
        const prev = required.get(variantId);
        required.set(variantId, {
          name,
          needed: (prev?.needed ?? 0) + qty,
        });
      };

      // Resolve each cart line to variant(s)
      const lines: {
        productId: string | null;
        comboId: string | null;
        variantId: string | null;
        variantName: string | null;
        name: string;
        unitPrice: Money;
        quantity: number;
      }[] = [];

      for (const item of cart.items) {
        if (item.product) {
          const variant =
            item.variant ?? (await getDefaultVariant(tx, item.product.id));
          addRequired(variant.id, item.product.name, item.quantity);
          lines.push({
            productId: item.product.id,
            comboId: null,
            variantId: variant.id,
            variantName: variant.isDefault ? null : variant.name,
            name: item.product.name,
            // Decimal throughout — never Number(). See src/lib/money.ts.
            unitPrice: toPaise(money(item.product.price).plus(money(variant.priceDelta))),
            quantity: item.quantity,
          });
        } else if (item.combo) {
          for (const comboItem of item.combo.items) {
            const variant = await getDefaultVariant(tx, comboItem.productId);
            addRequired(
              variant.id,
              comboItem.product.name,
              comboItem.quantity * item.quantity
            );
          }
          lines.push({
            productId: null,
            comboId: item.combo.id,
            variantId: null,
            variantName: null,
            name: item.combo.name,
            unitPrice: toPaise(money(item.combo.bundlePrice)),
            quantity: item.quantity,
          });
        }
      }

      // Validate stock per variant
      for (const [variantId, req] of required) {
        const variant = await tx.variant.findUniqueOrThrow({
          where: { id: variantId },
        });
        if (variant.stock < req.needed) {
          throw new Error(`${req.name} is out of stock`);
        }
      }

      const orderItemsData = lines.map((line) => ({
        productId: line.productId,
        comboId: line.comboId,
        variantId: line.variantId,
        variantName: line.variantName,
        name: line.name,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: toPaise(line.unitPrice.times(line.quantity)),
      }));

      // Same calculator the cart and checkout used — so what the customer was
      // shown is what gets charged.
      const totals = computeCartTotals(
        orderItemsData.map((i) => i.lineTotal),
        settings
      );

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.sub,
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          taxRate: totals.taxRate,
          taxAmount: totals.taxAmount,
          total: totals.total,
          shippingName: parsed.data.shippingName,
          shippingPhone: parsed.data.shippingPhone,
          shippingLine1: parsed.data.shippingLine1,
          shippingLine2: parsed.data.shippingLine2,
          shippingCity: parsed.data.shippingCity,
          shippingState: parsed.data.shippingState,
          shippingPincode: parsed.data.shippingPincode,
          items: { create: orderItemsData },
        },
      });

      for (const [variantId, req] of required) {
        await applyStockMovement(tx, {
          variantId,
          type: "SOLD",
          qty: -req.needed,
          orderId: order.id,
          byUserId: session.sub,
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order.id;
    });

    revalidatePath("/cart");
    revalidatePath("/products");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");

    const placedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (placedOrder) {
      await sendEmail({
        to: session.email,
        subject: `Order ${placedOrder.orderNumber} confirmed`,
        html: orderConfirmationHtml({
          orderNumber: placedOrder.orderNumber,
          total: placedOrder.total.toString(),
          items: placedOrder.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            lineTotal: i.lineTotal.toString(),
          })),
        }),
      });
    }

    return { orderId };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not place order",
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string
): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true },
  });
  if (!order) return { error: "Order not found" };

  const allowed = STATUS_FLOW[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { error: `Cannot move order from ${order.status} to ${nextStatus}` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Guard against a concurrent transition (double-click / two staff)
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: nextStatus as never },
      });
      if (updated.count === 0) {
        throw new Error("Order status changed by someone else. Refresh and retry.");
      }
      if (nextStatus === "CANCELLED") {
        await restockOrderItems(tx, order, session.sub);
      }
      // Inside the transaction: the log lands or rolls back with the change.
      await recordAudit(
        {
          actorId: session.sub,
          action: nextStatus === "CANCELLED" ? "order.cancel" : "order.status_change",
          entity: "Order",
          entityId: orderId,
          summary: `${order.orderNumber}: ${order.status} → ${nextStatus}`,
          metadata: {
            from: order.status,
            to: nextStatus,
            orderNumber: order.orderNumber,
            total: order.total.toString(),
          },
        },
        tx
      );
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not update order",
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath("/admin/inventory");

  await sendEmail({
    to: order.user.email,
    subject: `Order ${order.orderNumber} is now ${nextStatus}`,
    html: orderStatusUpdateHtml(
      { orderNumber: order.orderNumber, total: order.total.toString(), items: [] },
      nextStatus
    ),
  });

  return {};
}

export async function cancelOwnOrder(orderId: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.userId !== user.sub) {
    return { error: "Order not found" };
  }
  if (order.status !== "PENDING") {
    return { error: "Only pending orders can be cancelled" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (updated.count === 0) {
        throw new Error("Order can no longer be cancelled");
      }
      await restockOrderItems(tx, order, user.sub);
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not cancel order",
    };
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}
