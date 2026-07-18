"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { applyStockMovement, recomputeProductStock } from "@/lib/inventory";
import { recordAudit } from "@/lib/audit";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

/** Find a slug that isn't taken yet, appending -2, -3, ... on conflict. */
async function resolveFreeSlug(
  slug: string,
  excludeId?: string
): Promise<string> {
  const taken = await prisma.product.findMany({
    where: {
      slug: { startsWith: slug },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { slug: true },
  });
  const takenSet = new Set(taken.map((p) => p.slug));
  if (!takenSet.has(slug)) return slug;
  for (let n = 2; ; n++) {
    const candidate = `${slug}-${n}`;
    if (!takenSet.has(candidate)) return candidate;
  }
}

export async function createProduct(
  input: ProductInput
): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { variants, ...productData } = parsed.data;
  productData.slug = await resolveFreeSlug(productData.slug);

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          mrp: productData.mrp ?? null,
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

  const { variants, ...productData } = parsed.data;
  productData.slug = await resolveFreeSlug(productData.slug, id);

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
        // mrp must be written explicitly: undefined would leave a cleared
        // MRP in place instead of removing it.
        data: { ...productData, mrp: productData.mrp ?? null },
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
  revalidatePath(`/products/${productData.slug}`);
  redirect("/admin/products");
}

export async function setProductActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);

  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, slug: true, isActive: true },
  });
  if (!product) return { error: "Product not found" };
  if (product.isActive === isActive) return {};

  await prisma.product.update({ where: { id }, data: { isActive } });

  await recordAudit({
    actorId: session.sub,
    action: isActive ? "product.activate" : "product.deactivate",
    entity: "Product",
    entityId: id,
    summary: `${isActive ? "Activated" : "Deactivated"} product "${product.name}"`,
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/combos");
  return {};
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);

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

  const doomed = await prisma.product.findUnique({
    where: { id },
    select: { name: true, slug: true, price: true },
  });

  await prisma.product.delete({ where: { id } });

  await recordAudit({
    actorId: session.sub,
    action: "product.delete",
    entity: "Product",
    entityId: id,
    summary: `Deleted product "${doomed?.name ?? id}"`,
    metadata: doomed
      ? { name: doomed.name, slug: doomed.slug, price: doomed.price.toString() }
      : undefined,
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  return {};
}
