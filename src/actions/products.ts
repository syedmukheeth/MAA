"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { productSchema, type ProductInput } from "@/lib/validations/product";

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

  await prisma.product.create({
    data: {
      ...parsed.data,
      createdById: session.sub,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<{ error?: string }> {
  await requireRole([...MANAGE_ROLES]);
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

  await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

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

  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return {};
}
