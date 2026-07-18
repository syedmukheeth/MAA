"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { comboSchema, type ComboInput } from "@/lib/validations/combo";
import { recordAudit } from "@/lib/audit";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

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
  const session = await requireRole([...MANAGE_ROLES]);
  const parsed = comboSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.combo.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A combo with this slug already exists" };

  const optionError = await validateItemOptions(parsed.data.items);
  if (optionError) return { error: optionError };

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

  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  redirect("/admin/combos");
}

export async function updateCombo(
  id: string,
  input: ComboInput
): Promise<{ error?: string }> {
  await requireRole([...MANAGE_ROLES]);
  const parsed = comboSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const conflict = await prisma.combo.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (conflict) return { error: "A combo with this slug already exists" };

  const optionError = await validateItemOptions(parsed.data.items);
  if (optionError) return { error: optionError };

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

  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  revalidatePath(`/combos/${parsed.data.slug}`);
  redirect("/admin/combos");
}

export async function deleteCombo(id: string): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const doomed = await prisma.combo.findUnique({
    where: { id },
    select: { name: true, slug: true, bundlePrice: true },
  });
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
  const session = await requireRole([...MANAGE_ROLES]);
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
