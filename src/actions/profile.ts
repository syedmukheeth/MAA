"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export async function updateProfile(input: {
  name: string;
  password?: string;
}): Promise<{ error?: string; success?: boolean }> {
  const session = await requireAuth();

  if (!input.name || input.name.trim().length < 2) {
    return { error: "Name must be at least 2 characters long." };
  }

  const data: { name: string; passwordHash?: string } = {
    name: input.name,
  };

  if (input.password) {
    if (input.password.length < 8) {
      return { error: "Password must be at least 8 characters long." };
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
