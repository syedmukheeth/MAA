"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { addressSchema, type AddressInput } from "@/lib/validations/address";

export async function saveAddress(
  input: AddressInput
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAuth();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address data" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: session.sub } });
      const isDefault = count === 0 ? true : parsed.data.isDefault;

      if (isDefault) {
        // Unset defaults on siblings
        await tx.address.updateMany({
          where: { userId: session.sub, isDefault: true },
          data: { isDefault: false },
        });
      }

      await tx.address.create({
        data: {
          userId: session.sub,
          label: parsed.data.label || null,
          name: parsed.data.name,
          phone: parsed.data.phone,
          line1: parsed.data.line1,
          line2: parsed.data.line2 || null,
          city: parsed.data.city,
          state: parsed.data.state,
          pincode: parsed.data.pincode,
          isDefault,
        },
      });
    });

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save address" };
  }
}

export async function updateAddress(
  id: string,
  input: AddressInput
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAuth();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address data" };
  }

  // Verify ownership
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== session.sub) {
    return { error: "Address not found" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const isDefault = parsed.data.isDefault;

      if (isDefault) {
        // Unset defaults on siblings
        await tx.address.updateMany({
          where: { userId: session.sub, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      await tx.address.update({
        where: { id },
        data: {
          label: parsed.data.label || null,
          name: parsed.data.name,
          phone: parsed.data.phone,
          line1: parsed.data.line1,
          line2: parsed.data.line2 || null,
          city: parsed.data.city,
          state: parsed.data.state,
          pincode: parsed.data.pincode,
          isDefault,
        },
      });
    });

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update address" };
  }
}

export async function deleteAddress(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAuth();

  // Verify ownership
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== session.sub) {
    return { error: "Address not found" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      if (address.isDefault) {
        // Promote most recent remaining address to default
        const latest = await tx.address.findFirst({
          where: { userId: session.sub },
          orderBy: { updatedAt: "desc" },
        });
        if (latest) {
          await tx.address.update({
            where: { id: latest.id },
            data: { isDefault: true },
          });
        }
      }
    });

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete address" };
  }
}

export async function setDefaultAddress(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAuth();

  // Verify ownership
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== session.sub) {
    return { error: "Address not found" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId: session.sub, isDefault: true },
        data: { isDefault: false },
      });
      await tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to set default address" };
  }
}
