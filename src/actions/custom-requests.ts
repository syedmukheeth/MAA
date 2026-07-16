"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_FLOW,
} from "@/lib/validations/custom-request";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export async function updateRequestStatus(
  id: string,
  status: (typeof REQUEST_STATUSES)[number]
): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);

  const request = await prisma.customFurnitureRequest.findUnique({
    where: { id },
    select: { status: true, name: true },
  });
  if (!request) return { error: "Request not found" };

  const allowed = REQUEST_STATUS_FLOW[request.status] ?? [];
  if (!allowed.includes(status)) {
    return { error: `Cannot move request from ${request.status} to ${status}` };
  }

  await prisma.customFurnitureRequest.update({
    where: { id },
    data: { status },
  });

  await recordAudit({
    actorId: session.sub,
    action: "request.status_change",
    entity: "CustomFurnitureRequest",
    entityId: id,
    summary: `${request.name}: ${request.status} → ${status}`,
    metadata: { from: request.status, to: status },
  });

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  return {};
}
