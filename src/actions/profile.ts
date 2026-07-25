"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function updateProfile(input: {
  name: string;
  currentPassword?: string;
  password?: string;
}): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAuth();

  const name = input.name?.trim() ?? "";
  if (name.length < 2) {
    return { error: "Name must be at least 2 characters long." };
  }

  const data: { name: string; passwordHash?: string } = { name };

  if (input.password) {
    if (input.password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }
    // A session alone must not be enough to change the password — otherwise a
    // borrowed browser or a stolen cookie converts into permanent account
    // takeover, since the new password locks the real owner out.
    const account = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { passwordHash: true },
    });
    if (!account) return { error: "Account not found." };
    if (
      !input.currentPassword ||
      !(await verifyPassword(input.currentPassword, account.passwordHash))
    ) {
      return { error: "Your current password is incorrect." };
    }
    data.passwordHash = await hashPassword(input.password);
  }

  await prisma.user.update({
    where: { id: session.sub },
    data,
  });

  revalidatePath("/account");
  return { success: true };
}
