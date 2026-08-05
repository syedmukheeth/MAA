"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { comboSchema, type ComboInput } from "@/lib/validations/combo";
import { recordAudit } from "@/lib/audit";

import { STAFF_ROLES } from "@/lib/auth/roles";

/** Every optionVariantId must be a variant of that item's product. */
async function validateItemOptions(
  items: { productId: string; optionVariantIds: string[] }[]
): Promise<string | null> {
  const variantIds = items.flatMap((i) => i.optionVariantIds);
  if (variantIds.length === 0) return null;
  const variants = await prisma.variant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, productId: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v.productId]));
  for (const item of items) {
    for (const vid of item.optionVariantIds) {
      if (byId.get(vid) !== item.productId) {
        return "One of the selected options does not belong to its product";
      }
    }
  }
  return null;
}

export async function createCombo(input: ComboInput): Promise<{ error?: string }> {
  const session = await requireRole([...STAFF_ROLES]);
  const parsed = comboSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  if (new Set(productIds).size !== productIds.length) {
    return { error: "A product cannot be added more than once to a single combo offer" };
  }

  const existing = await prisma.combo.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A combo with this slug already exists" };

  const optionError = await validateItemOptions(parsed.data.items);
  if (optionError) return { error: optionError };

  try {
    await prisma.combo.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        bundlePrice: parsed.data.bundlePrice,
        image: parsed.data.image || null,
        isActive: parsed.data.isActive,
        createdById: session.sub,
        items: {
          create: parsed.data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            options: {
              create: i.optionVariantIds.map((variantId) => ({ variantId })),
            },
          })),
        },
      },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create combo offer" };
  }

  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return {};
}

export async function updateCombo(
  id: string,
  input: ComboInput
): Promise<{ error?: string }> {
  await requireRole([...STAFF_ROLES]);
  const parsed = comboSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  if (new Set(productIds).size !== productIds.length) {
    return { error: "A product cannot be added more than once to a single combo offer" };
  }

  const conflict = await prisma.combo.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (conflict) return { error: "A combo with this slug already exists" };

  const optionError = await validateItemOptions(parsed.data.items);
  if (optionError) return { error: optionError };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.comboItem.deleteMany({ where: { comboId: id } });
      await tx.combo.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description,
          bundlePrice: parsed.data.bundlePrice,
          image: parsed.data.image || null,
          isActive: parsed.data.isActive,
          items: {
            create: parsed.data.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              options: {
                create: i.optionVariantIds.map((variantId) => ({ variantId })),
              },
            })),
          },
        },
      });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update combo offer" };
  }

  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  revalidatePath(`/combos/${parsed.data.slug}`);
  return {};
}

export async function deleteCombo(id: string): Promise<{ error?: string }> {
  const session = await requireRole([...STAFF_ROLES]);
  const doomed = await prisma.combo.findUnique({
    where: { id },
    select: { name: true, slug: true, bundlePrice: true },
  });

  const usedInCart = await prisma.cartItem.findFirst({
    where: { comboId: id },
  });
  if (usedInCart) {
    return {
      error: "This combo offer is currently in customer shopping carts and cannot be deleted. Deactivate it instead.",
    };
  }

  await prisma.combo.delete({ where: { id } });
  await recordAudit({
    actorId: session.sub,
    action: "combo.delete",
    entity: "Combo",
    entityId: id,
    summary: `Deleted combo "${doomed?.name ?? id}"`,
    metadata: doomed
      ? { name: doomed.name, slug: doomed.slug, bundlePrice: doomed.bundlePrice.toString() }
      : undefined,
  });
  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return {};
}

export async function toggleComboActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const session = await requireRole([...STAFF_ROLES]);
  const combo = await prisma.combo.update({ where: { id }, data: { isActive } });
  await recordAudit({
    actorId: session.sub,
    action: "combo.toggle_active",
    entity: "Combo",
    entityId: id,
    summary: `${combo.name} ${isActive ? "activated" : "deactivated"}`,
    metadata: { isActive },
  });
  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return {};
}
