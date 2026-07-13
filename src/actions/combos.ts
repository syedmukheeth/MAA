"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { comboSchema, type ComboInput } from "@/lib/validations/combo";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export async function createCombo(input: ComboInput): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const parsed = comboSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.combo.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "A combo with this slug already exists" };

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
  await requireRole([...MANAGE_ROLES]);
  await prisma.combo.delete({ where: { id } });
  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return {};
}

export async function toggleComboActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  await requireRole([...MANAGE_ROLES]);
  await prisma.combo.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return {};
}
