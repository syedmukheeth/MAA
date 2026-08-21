"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, getActiveUser } from "@/lib/auth/session";
import {
  shippingAddressSchema,
  paymentMethodSchema,
  type ShippingAddressInput,
} from "@/lib/validations/checkout";
import {
  applyStockMovement,
  getDefaultVariant,
  restockOrderItems,
  InsufficientStockError,
} from "@/lib/inventory";
import { sendEmail } from "@/lib/email";
import { orderConfirmationHtml, orderStatusUpdateHtml } from "@/lib/email-templates";
import {
  getSiteSettings,
  PURCHASES_DISABLED_MESSAGE,
  STAFF_PURCHASE_BLOCKED_MESSAGE,
} from "@/lib/site-settings";
import { money, toPaise, type Money } from "@/lib/money";
import { computeCartTotals } from "@/lib/cart";
import { recordAudit } from "@/lib/audit";
import { isRefundable } from "@/lib/payments";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { Prisma, type OrderStatus } from "@/generated/prisma/client";
import { randomBytes } from "node:crypto";

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Marks the messages that are safe to show a customer. Everything else in the
 * checkout transaction is a Prisma/runtime error whose text names tables and
 * columns, so it gets replaced with a generic message on the way out.
 */
class CheckoutError extends Error {}

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
  input: ShippingAddressInput & { saveAddress?: boolean; paymentMethod?: string }
): Promise<{ error?: string; orderId?: string }> {
  const session = await requireAuth();

  // Staff run the shop; an order placed from an OWNER/ADMIN/MANAGER account
  // would land in the same queue they process and distort every sales report.
  if (session.role !== "CUSTOMER") {
    return { error: STAFF_PURCHASE_BLOCKED_MESSAGE };
  }

  // Checked here as well as in addToCart: a cart filled before buying was
  // switched off must not still be checkout-able.
  if (!(await getSiteSettings()).allowPurchases) {
    return { error: PURCHASES_DISABLED_MESSAGE };
  }

  const parsed = shippingAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address" };
  }

  // Was written straight to the order as free text. A customer could POST
  // paymentMethod: "UPI" (or anything at all), pay nothing, cancel, and the
  // cancel paths below would queue a refund for the full order total.
  const parsedMethod = paymentMethodSchema.safeParse(input.paymentMethod ?? "COD");
  if (!parsedMethod.success) {
    return { error: "Choose a valid payment method" };
  }
  const paymentMethod = parsedMethod.data;

  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
          combo: { include: { items: { include: { product: true } } } },
          comboSelections: { include: { variant: true } },
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

  // Server-side twin of the check in CheckoutWizard: the allowCOD/allowUPI kill
  // switches were previously enforced only in the browser, so turning one off
  // stopped nothing.
  if (paymentMethod === "COD" && !settings.allowCOD) {
    return { error: "Cash on Delivery is currently unavailable." };
  }
  if (paymentMethod === "UPI" && !settings.allowUPI) {
    return { error: "UPI Payment is currently unavailable." };
  }

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
        optionsSummary: string | null;
        unitPrice: Money;
        quantity: number;
      }[] = [];

      for (const item of cart.items) {
        if (item.product) {
          if (!item.product.isActive) {
            throw new CheckoutError(`${item.product.name} is no longer available`);
          }
          const variant =
            item.variant ?? (await getDefaultVariant(tx, item.product.id));
          addRequired(variant.id, item.product.name, item.quantity);
          lines.push({
            productId: item.product.id,
            comboId: null,
            variantId: variant.id,
            variantName: variant.isDefault ? null : variant.name,
            name: item.product.name,
            optionsSummary: null,
            // Decimal throughout — never Number(). See src/lib/money.ts.
            unitPrice: toPaise(money(item.product.price).plus(money(variant.priceDelta))),
            quantity: item.quantity,
          });
        } else if (item.combo) {
          const summaryParts: string[] = [];
          for (const comboItem of item.combo.items) {
            if (!comboItem.product.isActive) {
              throw new CheckoutError(`${item.combo.name} is no longer available`);
            }
            // Customer's chosen option deducts THAT variant, not the default.
            const selection = item.comboSelections.find(
              (s) => s.comboItemId === comboItem.id
            );
            const variant =
              selection?.variant ??
              (await getDefaultVariant(tx, comboItem.productId));
            addRequired(
              variant.id,
              comboItem.product.name,
              comboItem.quantity * item.quantity
            );
            if (selection) {
              summaryParts.push(`${comboItem.product.name}: ${variant.name}`);
            }
          }
          lines.push({
            productId: null,
            comboId: item.combo.id,
            variantId: null,
            variantName: null,
            name: item.combo.name,
            optionsSummary: summaryParts.length > 0 ? summaryParts.join("; ") : null,
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
          throw new CheckoutError(`${req.name} is out of stock`);
        }
      }

      const orderItemsData = lines.map((line) => ({
        productId: line.productId,
        comboId: line.comboId,
        variantId: line.variantId,
        variantName: line.variantName,
        name: line.name,
        optionsSummary: line.optionsSummary,
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
          paymentMethod,
          // UPI is a manual transfer: the customer says they sent it, staff
          // confirm it against the bank (markOrderPaid). COD collects on
          // delivery, so UNPAID here is the correct, expected state.
          paymentState:
            paymentMethod === "UPI" ? "AWAITING_VERIFICATION" : "UNPAID",
          items: { create: orderItemsData },
        },
      });

      if (input.saveAddress) {
        const existing = await tx.address.findFirst({
          where: {
            userId: session.sub,
            name: parsed.data.shippingName,
            phone: parsed.data.shippingPhone,
            line1: parsed.data.shippingLine1,
            line2: parsed.data.shippingLine2 ?? null,
            city: parsed.data.shippingCity,
            state: parsed.data.shippingState,
            pincode: parsed.data.shippingPincode,
          },
        });
        if (!existing) {
          const count = await tx.address.count({ where: { userId: session.sub } });
          await tx.address.create({
            data: {
              userId: session.sub,
              name: parsed.data.shippingName,
              phone: parsed.data.shippingPhone,
              line1: parsed.data.shippingLine1,
              line2: parsed.data.shippingLine2 ?? null,
              city: parsed.data.shippingCity,
              state: parsed.data.shippingState,
              pincode: parsed.data.shippingPincode,
              isDefault: count === 0,
            },
          });
        }
      }

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

    // A bare floating promise does not survive a serverless invocation: Vercel
    // freezes the sandbox the moment the action's response is flushed, so the
    // confirmation email was being dropped on production while working locally.
    // `after()` keeps the invocation alive until this work settles.
    after(async () => {
      try {
        const placedOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
        if (placedOrder) {
          const sent = await sendEmail({
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

          if (!sent) {
            await recordAudit({
              actorId: session.sub,
              action: "order.email_failed",
              entity: "Order",
              entityId: placedOrder.id,
              summary: `Failed to send confirmation email for order ${placedOrder.orderNumber}`,
              metadata: { orderNumber: placedOrder.orderNumber },
            });
          }
        }
      } catch (e) {
        console.error(
          `Order confirmation email failed [${e instanceof Error ? e.name : "unknown"}]`
        );
        await recordAudit({
          actorId: session.sub,
          action: "order.email_failed",
          entity: "Order",
          entityId: orderId,
          summary: `Order confirmation email throw error: ${e instanceof Error ? e.message : String(e)}`,
          metadata: { orderId },
        });
      }
    });

    return { orderId };
  } catch (err) {
    if (err instanceof CheckoutError || err instanceof InsufficientStockError) {
      return { error: err.message };
    }
    // Only the error's type, never the error itself. A Prisma
    // PrismaClientKnownRequestError interpolates the failing query's parameters
    // into its message, and for this query those parameters are the customer's
    // shipping name, phone number and street address.
    console.error(
      `placeOrder failed [${err instanceof Error ? err.name : "unknown"}] [user=${session.sub}]`
    );
    return { error: "Could not place your order. Please try again." };
  }
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  cancelReason?: string
): Promise<{ error?: string }> {
  const session = await requireRole([...STAFF_ROLES]);

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
      // A refund is owed only if the shop actually holds the money. Keyed on
      // paymentState, not paymentMethod: the method says how the customer
      // intended to pay, which is not evidence that they did.
      const isPaid = isRefundable(order.paymentState);
      const initialRefundStatus =
        nextStatus === "CANCELLED"
          ? isPaid
            ? "PENDING"
            : "NOT_APPLICABLE"
          : undefined;

      // Guard against a concurrent transition (double-click / two staff)
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: {
          status: nextStatus,
          cancelReason: nextStatus === "CANCELLED" ? (cancelReason || "Cancelled by store management") : undefined,
          ...(nextStatus === "CANCELLED"
            ? {
                refundStatus: initialRefundStatus,
                // Only set an amount when there is one to pay back. Writing
                // order.total alongside NOT_APPLICABLE produced rows that
                // claimed a refund was due and simultaneously that it wasn't.
                refundAmount: isPaid ? order.total : null,
              }
            : {}),
        },
      });
      if (updated.count === 0) {
        throw new CheckoutError("Order status changed by someone else. Refresh and retry.");
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
            cancelReason: nextStatus === "CANCELLED" ? cancelReason : undefined,
          },
        },
        tx
      );
    });
  } catch (err) {
    if (err instanceof CheckoutError || err instanceof InsufficientStockError) {
      return { error: err.message };
    }
    console.error(
      `updateOrderStatus failed [${err instanceof Error ? err.name : "unknown"}] [order=${orderId}]`
    );
    return { error: "Could not update order" };
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
  const user = await getActiveUser();
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
    const isPaid = isRefundable(order.paymentState);
    await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: {
          status: "CANCELLED",
          // Only a confirmed payment queues a refund. Previously any non-COD
          // paymentMethod did — and paymentMethod came from the client.
          refundStatus: isPaid ? "PENDING" : "NOT_APPLICABLE",
          refundAmount: isPaid ? order.total : null,
        },
      });
      if (updated.count === 0) {
        throw new CheckoutError("Order can no longer be cancelled");
      }
      await restockOrderItems(tx, order, user.sub);
    });
  } catch (err) {
    if (err instanceof CheckoutError || err instanceof InsufficientStockError) {
      return { error: err.message };
    }
    console.error(
      `cancelOwnOrder failed [${err instanceof Error ? err.name : "unknown"}] [order=${orderId}]`
    );
    return { error: "Could not cancel order" };
  }

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

export async function updateRefundStatus(
  orderId: string,
  input: {
    status: "PENDING" | "PROCESSED" | "FAILED" | "NOT_APPLICABLE";
    refundTxnId?: string;
    notes?: string;
    /** String to preserve Decimal precision — do NOT accept a JS number. */
    amount?: string;
  }
): Promise<{ error?: string }> {
  const session = await requireRole([...STAFF_ROLES]);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found" };

  // You cannot refund money you never received. Without this, an unpaid order
  // could be walked to PROCESSED and paid out of the shop's pocket.
  if (
    !isRefundable(order.paymentState) &&
    (input.status === "PENDING" || input.status === "PROCESSED")
  ) {
    return {
      error:
        "This order has no confirmed payment, so there is nothing to refund. Mark the payment received first if the money did arrive.",
    };
  }

  let refundAmount: string | undefined;
  if (input.amount !== undefined) {
    // Parse as Decimal to avoid JS float precision errors on currency values.
    let refundDecimal: Prisma.Decimal;
    try {
      refundDecimal = new Prisma.Decimal(input.amount);
    } catch {
      return { error: "Invalid refund amount" };
    }
    if (refundDecimal.isNaN() || refundDecimal.isNegative() || !refundDecimal.isFinite()) {
      return { error: "Invalid refund amount" };
    }
    if (refundDecimal.greaterThan(order.total)) {
      return { error: "Refund amount cannot exceed order total" };
    }
    // Local, not written back into the caller's object: `input` belongs to the
    // caller and mutating it surprises whoever reuses it.
    refundAmount = refundDecimal.toDecimalPlaces(2).toString();
  }
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        refundStatus: input.status,
        refundTxnId: input.refundTxnId || order.refundTxnId,
        refundNotes: input.notes || order.refundNotes,
        refundAmount: refundAmount ?? (order.refundAmount ?? order.total),
        refundedAt: input.status === "PROCESSED" ? new Date() : order.refundedAt,
      },
    });

    await recordAudit({
      actorId: session.sub,
      action: "order.refund",
      entity: "Order",
      entityId: orderId,
      summary: `Updated refund status for ${order.orderNumber} to ${input.status}`,
      metadata: {
        orderNumber: order.orderNumber,
        refundStatus: input.status,
        refundTxnId: input.refundTxnId,
      },
    });
  } catch (err) {
    console.error(
      `updateRefundStatus failed [${err instanceof Error ? err.name : "unknown"}] [order=${orderId}]`
    );
    return { error: "Could not update refund status" };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}

/**
 * Records that a manual UPI transfer actually landed.
 *
 * The shop has no gateway: the customer scans a QR, pays, and says so. Until a
 * human matches that against the bank statement the order is
 * AWAITING_VERIFICATION, and nothing downstream — refunds especially — may
 * treat it as money in hand.
 */
export async function markOrderPaid(
  orderId: string,
  reference?: string
): Promise<{ error?: string }> {
  const session = await requireRole([...STAFF_ROLES]);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Order not found" };
  if (order.paymentState === "PAID") {
    return { error: "This payment is already confirmed" };
  }
  if (order.paymentState !== "AWAITING_VERIFICATION") {
    return {
      error:
        "Only UPI orders awaiting verification can be marked paid. COD is collected on delivery.",
    };
  }

  const trimmedReference = reference?.trim();

  try {
    await prisma.$transaction(async (tx) => {
      // Same optimistic guard updateOrderStatus uses: two staff working the
      // same order must not both confirm it.
      const updated = await tx.order.updateMany({
        where: { id: orderId, paymentState: "AWAITING_VERIFICATION" },
        data: {
          paymentState: "PAID",
          paymentReference: trimmedReference || null,
          paymentVerifiedAt: new Date(),
          paymentVerifiedById: session.sub,
        },
      });
      if (updated.count === 0) {
        throw new CheckoutError("Payment state changed by someone else. Refresh and retry.");
      }
      await recordAudit(
        {
          actorId: session.sub,
          action: "order.payment_verified",
          entity: "Order",
          entityId: orderId,
          summary: `${order.orderNumber}: UPI payment confirmed received`,
          metadata: {
            orderNumber: order.orderNumber,
            total: order.total.toString(),
            paymentReference: trimmedReference,
          },
        },
        tx
      );
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return { error: err.message };
    }
    console.error(
      `markOrderPaid failed [${err instanceof Error ? err.name : "unknown"}] [order=${orderId}]`
    );
    return { error: "Could not confirm the payment" };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return {};
}
