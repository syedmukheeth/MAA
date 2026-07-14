"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole, getCurrentUser } from "@/lib/auth/session";
import {
  shippingAddressSchema,
  type ShippingAddressInput,
} from "@/lib/validations/checkout";
import { sendEmail } from "@/lib/email";
import { orderConfirmationHtml, orderStatusUpdateHtml } from "@/lib/email-templates";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

const STATUS_FLOW: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function generateOrderNumber() {
  return `MAA-${Date.now().toString(36).toUpperCase()}`;
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
          combo: { include: { items: { include: { product: true } } } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Your cart is empty" };
  }

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      const required = new Map<string, { name: string; needed: number }>();

      for (const item of cart.items) {
        if (item.product) {
          const prev = required.get(item.product.id);
          required.set(item.product.id, {
            name: item.product.name,
            needed: (prev?.needed ?? 0) + item.quantity,
          });
        } else if (item.combo) {
          for (const comboItem of item.combo.items) {
            const prev = required.get(comboItem.productId);
            required.set(comboItem.productId, {
              name: comboItem.product.name,
              needed: (prev?.needed ?? 0) + comboItem.quantity * item.quantity,
            });
          }
        }
      }

      for (const [productId, req] of required) {
        const product = await tx.product.findUniqueOrThrow({
          where: { id: productId },
        });
        if (product.stockQuantity < req.needed) {
          throw new Error(`${req.name} is out of stock`);
        }
      }

      const orderItemsData = cart.items.map((item) => {
        const unitPrice = item.product?.price ?? item.combo!.bundlePrice;
        const lineTotal = Number(unitPrice) * item.quantity;
        return {
          productId: item.productId,
          comboId: item.comboId,
          name: item.product?.name ?? item.combo!.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        };
      });

      const subtotal = orderItemsData.reduce(
        (sum, i) => sum + Number(i.lineTotal),
        0
      );

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.sub,
          subtotal,
          total: subtotal,
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

      for (const [productId, req] of required) {
        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: { decrement: req.needed } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order.id;
    });

    revalidatePath("/cart");
    revalidatePath("/products");
    revalidatePath("/admin/orders");

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
  await requireRole([...MANAGE_ROLES]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });
  if (!order) return { error: "Order not found" };

  const allowed = STATUS_FLOW[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { error: `Cannot move order from ${order.status} to ${nextStatus}` };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus as never },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");

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

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      } else if (item.comboId) {
        const combo = await tx.combo.findUnique({
          where: { id: item.comboId },
          include: { items: true },
        });
        if (combo) {
          for (const comboItem of combo.items) {
            await tx.product.update({
              where: { id: comboItem.productId },
              data: {
                stockQuantity: { increment: comboItem.quantity * item.quantity },
              },
            });
          }
        }
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  });

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}
