"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";

/**
 * Triage controls for the error dashboard.
 *
 * Marking an error resolved is a claim, not a deletion — the row stays, and
 * `captureError` clears `resolvedAt` automatically if it happens again. That
 * makes "we thought this was fixed and it is not" visible, which is the single
 * most useful thing an error tracker can tell you.
 */
export async function resolveError(
  fingerprint: string
): Promise<{ error?: string; success?: boolean }> {
  await requireRole([...ADMIN_ROLES]);

  const existing = await prisma.errorEvent.findUnique({
    where: { fingerprint },
    select: { id: true },
  });
  if (!existing) return { error: "That error is no longer recorded." };

  await prisma.errorEvent.update({
    where: { fingerprint },
    data: { resolvedAt: new Date() },
  });

  revalidatePath("/admin/monitoring");
  return { success: true };
}

export async function reopenError(
  fingerprint: string
): Promise<{ error?: string; success?: boolean }> {
  await requireRole([...ADMIN_ROLES]);

  await prisma.errorEvent.updateMany({
    where: { fingerprint },
    data: { resolvedAt: null },
  });

  revalidatePath("/admin/monitoring");
  return { success: true };
}
