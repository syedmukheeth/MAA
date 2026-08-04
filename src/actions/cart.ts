"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth, getActiveUser } from "@/lib/auth/session";
import { getDefaultVariant } from "@/lib/inventory";
import {
  getSiteSettings,
  PURCHASES_DISABLED_MESSAGE,
} from "@/lib/site-settings";

/**
 * Server actions receive whatever the caller POSTs, so `quantity` can arrive as
 * NaN, a fraction, or 1e9. NaN in particular slips past every `>` stock check
 * and lands in the database.
 */
const MAX_LINE_QUANTITY = 99;

function sanitizeQuantity(value: number) {
  if (!Number.isFinite(value)) return null;
  const qty = Math.floor(value);
  if (qty < 1) return null;
  return Math.min(qty, MAX_LINE_QUANTITY);
}

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.cart.create({ data: { userId } });
}

function revalidateCartPaths() {
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function addToCart(input: {
  productId?: string;
  variantId?: string;
  comboId?: string;
  comboSelections?: { comboItemId: string; variantId: string }[];
  quantity: number;
}): Promise<{ error?: string; requiresAuth?: boolean }> {
  // The catalogue is public, so an anonymous visitor reaching this is a normal
  // path — not an error. Signal it so the client can route to login and come
  // back, instead of inferring "signed out" from any thrown error.
  const { allowPurchases } = await getSiteSettings();
  if (!allowPurchases) {
    return { error: PURCHASES_DISABLED_MESSAGE };
  }

  const session = await getActiveUser();
  if (!session) {
    return { requiresAuth: true, error: "Please sign in to add items to your cart" };
  }
  const quantity = sanitizeQuantity(input.quantity);
  if (quantity === null) {
    return { error: "Please choose a valid quantity" };
  }

  if (!input.productId && !input.comboId) {
    return { error: "Nothing to add to cart" };
  }

  const cart = await getOrCreateCart(session.sub);

  if (input.productId) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!product || !product.isActive) return { error: "Product not found" };

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
      include: {
        items: {
          include: {
            product: true,
            options: { include: { variant: true } },
          },
        },
      },
    });
    if (!combo || !combo.isActive) return { error: "Combo not found" };
    if (combo.items.some((i) => !i.product.isActive)) {
      return { error: "This combo is currently unavailable" };
    }

    // Resolve one variant per option-bearing item: the customer's pick if it
    // is one of the allowed options, otherwise the first option.
    const requested = new Map(
      (input.comboSelections ?? []).map((s) => [s.comboItemId, s.variantId])
    );
    const resolvedSelections: { comboItemId: string; variantId: string }[] = [];
    for (const item of combo.items) {
      if (item.options.length === 0) continue;
      const picked = requested.get(item.id);
      const option =
        item.options.find((o) => o.variantId === picked) ?? item.options[0];
      resolvedSelections.push({ comboItemId: item.id, variantId: option.variantId });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_comboId: { cartId: cart.id, comboId: combo.id } },
    });
    const nextQty = (existingItem?.quantity ?? 0) + quantity;

    for (const item of combo.items) {
      const selection = resolvedSelections.find((s) => s.comboItemId === item.id);
      if (selection) {
        const variant = item.options.find(
          (o) => o.variantId === selection.variantId
        )!.variant;
        if (item.quantity * nextQty > variant.stock) {
          return {
            error: `${item.product.name} (${variant.name}) doesn't have enough stock for this combo`,
          };
        }
      } else if (item.quantity * nextQty > item.product.stockQuantity) {
        return { error: `${item.product.name} doesn't have enough stock for this combo` };
      }
    }

    if (existingItem) {
      // Re-adding the same combo updates the stored option choices too.
      await prisma.$transaction([
        prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: nextQty },
        }),
        prisma.cartComboSelection.deleteMany({
          where: { cartItemId: existingItem.id },
        }),
        prisma.cartComboSelection.createMany({
          data: resolvedSelections.map((s) => ({
            cartItemId: existingItem.id,
            comboItemId: s.comboItemId,
            variantId: s.variantId,
          })),
        }),
      ]);
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          comboId: combo.id,
          quantity,
          comboSelections: {
            create: resolvedSelections.map((s) => ({
              comboItemId: s.comboItemId,
              variantId: s.variantId,
            })),
          },
        },
      });
    }
  }

  revalidateCartPaths();
  return {};
}

export async function updateCartItemQuantity(
  cartItemId: string,
  rawQuantity: number
): Promise<{ error?: string }> {
  const session = await requireAuth();
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      product: true,
      variant: true,
      combo: { include: { items: { include: { product: true } } } },
      comboSelections: { include: { variant: true } },
    },
  });
  if (!item || item.cart.userId !== session.sub) {
    return { error: "Cart item not found" };
  }

  if (Number.isFinite(rawQuantity) && rawQuantity <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    revalidateCartPaths();
    return {};
  }

  const quantity = sanitizeQuantity(rawQuantity);
  if (quantity === null) {
    return { error: "Please choose a valid quantity" };
  }

  if (item.variant && quantity > item.variant.stock) {
    return { error: `Only ${item.variant.stock} left in stock` };
  }
  if (!item.variant && item.product && quantity > item.product.stockQuantity) {
    return { error: `Only ${item.product.stockQuantity} left in stock` };
  }
  if (item.combo) {
    for (const comboItem of item.combo.items) {
      const selection = item.comboSelections.find(
        (s) => s.comboItemId === comboItem.id
      );
      if (selection) {
        if (comboItem.quantity * quantity > selection.variant.stock) {
          return {
            error: `${comboItem.product.name} (${selection.variant.name}) doesn't have enough stock`,
          };
        }
      } else if (comboItem.quantity * quantity > comboItem.product.stockQuantity) {
        return { error: `${comboItem.product.name} doesn't have enough stock` };
      }
    }
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });
  revalidateCartPaths();
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
  revalidateCartPaths();
  return {};
}

export async function clearCart(): Promise<void> {
  const session = await requireAuth();
  const cart = await prisma.cart.findUnique({ where: { userId: session.sub } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  revalidateCartPaths();
}
