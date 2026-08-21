"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { createSessionCookie } from "@/lib/auth/session-cookie";
import { type Role } from "@/lib/auth/jwt";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { passwordSchema } from "@/lib/validations/auth";

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
    // Same rule as registration and reset. A profile edit that accepted a weaker
    // password than signup would make this the cheapest way to weaken an account.
    const passwordCheck = passwordSchema.safeParse(input.password);
    if (!passwordCheck.success) {
      return {
        error: passwordCheck.error.issues[0]?.message ?? "Invalid password.",
      };
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

  const updated = await prisma.user.update({
    where: { id: session.sub },
    data: {
      ...data,
      // If the password changed, bump tokenVersion so every other session
      // (stolen cookies, forgotten tabs) is forced to re-authenticate.
      ...(data.passwordHash
        ? { tokenVersion: { increment: 1 }, passwordChangedAt: new Date() }
        : {}),
    },
    select: {
      id: true,
      email: true,
      role: true,
      tokenVersion: true,
      mustChangePassword: true,
    },
  });

  // The bump above invalidates THIS browser's cookie too — getActiveUser
  // compares dbUser.tokenVersion against the `tv` claim — so without re-issuing
  // it the user is silently signed out by the act of securing their account.
  // Same reasoning as changePasswordAction in src/actions/auth.ts.
  if (data.passwordHash) {
    await createSessionCookie({
      id: updated.id,
      email: updated.email,
      role: updated.role as Role,
      tokenVersion: updated.tokenVersion,
      mustChangePassword: updated.mustChangePassword,
    });
  }

  revalidatePath("/account");
  return { success: true };
}
