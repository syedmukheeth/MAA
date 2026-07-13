"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { REQUEST_STATUSES } from "@/lib/validations/custom-request";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export async function updateRequestStatus(
  id: string,
  status: (typeof REQUEST_STATUSES)[number]
): Promise<{ error?: string }> {
  await requireRole([...MANAGE_ROLES]);

  await prisma.customFurnitureRequest.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  return {};
}
