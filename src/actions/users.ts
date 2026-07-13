"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import type { Role } from "@/lib/auth/jwt";

export async function changeUserRole(
  userId: string,
  nextRole: Role
): Promise<{ error?: string }> {
  const session = await requireRole(["OWNER", "ADMIN"]);

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found" };

  if (target.role === "OWNER" && session.role !== "OWNER") {
    return { error: "Only an Owner can change another Owner's role" };
  }
  if (target.id === session.sub && nextRole !== "OWNER") {
    return { error: "You cannot change your own role" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole },
  });

  revalidatePath("/admin/users");
  return {};
}

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const session = await requireRole(["OWNER", "ADMIN"]);

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { error: "User not found" };
  if (target.role === "OWNER" && session.role !== "OWNER") {
    return { error: "Only an Owner can deactivate another Owner" };
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin/users");
  return {};
}
