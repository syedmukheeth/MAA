"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { applyStockMovement, recomputeProductStock } from "@/lib/inventory";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export async function createProduct(
  input: ProductInput
): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { error: "A product with this slug already exists" };
  }

  const { variants, ...productData } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          createdById: session.sub,
        },
      });

      for (const [index, v] of variants.entries()) {
        const variant = await tx.variant.create({
          data: {
            productId: product.id,
            name: v.name,
            woodType: v.woodType || null,
            finish: v.finish || null,
            size: v.size || null,
            priceDelta: v.priceDelta,
            sku: v.sku || null,
            lowStockThreshold: v.lowStockThreshold,
            isDefault: index === 0,
          },
        });
        if (v.stock > 0) {
          await applyStockMovement(tx, {
            variantId: variant.id,
            type: "RECEIVED",
            qty: v.stock,
            reason: "Initial stock",
            byUserId: session.sub,
          });
        }
      }
      await recomputeProductStock(tx, product.id);
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create product",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const conflict = await prisma.product.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (conflict) {
    return { error: "A product with this slug already exists" };
  }

  const { variants, ...productData } = parsed.data;

  const existingVariants = await prisma.variant.findMany({
    where: { productId: id },
    include: { _count: { select: { orderItems: true, cartItems: true } } },
  });

  const keptIds = new Set(
    variants.map((v) => v.id).filter((v): v is string => Boolean(v))
  );
  const toDelete = existingVariants.filter((v) => !keptIds.has(v.id));
  const blocked = toDelete.find(
    (v) => v._count.orderItems > 0 || v._count.cartItems > 0
  );
  if (blocked) {
    return {
      error: `Variant "${blocked.name}" is referenced by orders or carts and cannot be removed`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: productData,
      });

      for (const v of toDelete) {
        await tx.variant.delete({ where: { id: v.id } });
      }

      for (const [index, v] of variants.entries()) {
        if (v.id) {
          // Existing variant: stock is managed via inventory movements, not here
          await tx.variant.update({
            where: { id: v.id },
            data: {
              name: v.name,
              woodType: v.woodType || null,
              finish: v.finish || null,
              size: v.size || null,
              priceDelta: v.priceDelta,
              sku: v.sku || null,
              lowStockThreshold: v.lowStockThreshold,
              isDefault: index === 0,
            },
          });
        } else {
          const variant = await tx.variant.create({
            data: {
              productId: id,
              name: v.name,
              woodType: v.woodType || null,
              finish: v.finish || null,
              size: v.size || null,
              priceDelta: v.priceDelta,
              sku: v.sku || null,
              lowStockThreshold: v.lowStockThreshold,
              isDefault: index === 0,
            },
          });
          if (v.stock > 0) {
            await applyStockMovement(tx, {
              variantId: variant.id,
              type: "RECEIVED",
              qty: v.stock,
              reason: "Initial stock",
              byUserId: session.sub,
            });
          }
        }
      }
      await recomputeProductStock(tx, id);
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not update product",
    };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${parsed.data.slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireRole([...MANAGE_ROLES]);

  const usedInCombo = await prisma.comboItem.findFirst({
    where: { productId: id },
  });
  if (usedInCombo) {
    return {
      error: "This product is part of a combo offer. Remove it from the combo first.",
    };
  }

  const usedInOrder = await prisma.orderItem.findFirst({
    where: { productId: id },
  });
  if (usedInOrder) {
    return {
      error: "This product has orders against it and cannot be deleted.",
    };
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return {};
}
