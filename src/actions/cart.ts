"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { getDefaultVariant } from "@/lib/inventory";

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

export async function addToCart(input: {
  productId?: string;
  variantId?: string;
  comboId?: string;
  quantity: number;
}): Promise<{ error?: string }> {
  const session = await requireAuth();
  const quantity = Math.max(1, Math.floor(input.quantity));

  if (!input.productId && !input.comboId) {
    return { error: "Nothing to add to cart" };
  }

  const cart = await getOrCreateCart(session.sub);

  if (input.productId) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product) return { error: "Product not found" };

    const variant = input.variantId
      ? await prisma.variant.findUnique({ where: { id: input.variantId } })
      : await getDefaultVariant(prisma, product.id);
    if (!variant || variant.productId !== product.id) {
      return { error: "Variant not found" };
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
    });
    const nextQty = (existingItem?.quantity ?? 0) + quantity;
    if (nextQty > variant.stock) {
      return { error: `Only ${variant.stock} left in stock` };
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: variant.id,
          quantity,
        },
      });
    }
  } else if (input.comboId) {
    const combo = await prisma.combo.findUnique({
      where: { id: input.comboId },
      include: { items: { include: { product: true } } },
    });
    if (!combo || !combo.isActive) return { error: "Combo not found" };

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_comboId: { cartId: cart.id, comboId: combo.id } },
    });
    const nextQty = (existingItem?.quantity ?? 0) + quantity;

    for (const item of combo.items) {
      if (item.quantity * nextQty > item.product.stockQuantity) {
        return { error: `${item.product.name} doesn't have enough stock for this combo` };
      }
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, comboId: combo.id, quantity },
      });
    }
  }

  revalidatePath("/cart");
  return {};
}

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<{ error?: string }> {
  const session = await requireAuth();
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      product: true,
      variant: true,
      combo: { include: { items: { include: { product: true } } } },
    },
  });
  if (!item || item.cart.userId !== session.sub) {
    return { error: "Cart item not found" };
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    revalidatePath("/cart");
    return {};
  }

  if (item.variant && quantity > item.variant.stock) {
    return { error: `Only ${item.variant.stock} left in stock` };
  }
  if (!item.variant && item.product && quantity > item.product.stockQuantity) {
    return { error: `Only ${item.product.stockQuantity} left in stock` };
  }
  if (item.combo) {
    for (const comboItem of item.combo.items) {
      if (comboItem.quantity * quantity > comboItem.product.stockQuantity) {
        return { error: `${comboItem.product.name} doesn't have enough stock` };
      }
    }
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });
  revalidatePath("/cart");
  return {};
}

export async function removeFromCart(cartItemId: string): Promise<{ error?: string }> {
  const session = await requireAuth();
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });
  if (!item || item.cart.userId !== session.sub) {
    return { error: "Cart item not found" };
  }
  await prisma.cartItem.delete({ where: { id: cartItemId } });
  revalidatePath("/cart");
  return {};
}

export async function clearCart(): Promise<void> {
  const session = await requireAuth();
  const cart = await prisma.cart.findUnique({ where: { userId: session.sub } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  revalidatePath("/cart");
}
