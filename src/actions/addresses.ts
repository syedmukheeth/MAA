"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { addressSchema, type AddressInput } from "@/lib/validations/address";

/**
 * Marks a message that is safe to put in front of a customer. Anything else
 * thrown in here is a Prisma error whose text names tables, columns and the
 * failing query's parameters — which for these queries are the customer's own
 * name, phone number and street address. Same pattern as src/actions/orders.ts.
 */
class AddressError extends Error {}

function addressFailure(err: unknown, fallback: string, context: string) {
  if (err instanceof AddressError) return { error: err.message };
  console.error(`${context} failed [${err instanceof Error ? err.name : "unknown"}]`);
  return { error: fallback };
}

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
      if (count >= 10) {
        throw new AddressError("Maximum limit of 10 addresses reached. Please delete an old address to add a new one.");
      }
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
    return addressFailure(err, "Failed to save address", "saveAddress");
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
    return addressFailure(err, "Failed to update address", "updateAddress");
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
    return addressFailure(err, "Failed to delete address", "deleteAddress");
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
    return addressFailure(err, "Failed to set default address", "setDefaultAddress");
  }
}
