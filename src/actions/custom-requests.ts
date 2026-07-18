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
  status: (typeof REQUEST_STATUSES)[number],
  note?: string
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

  const trimmedNote = note?.trim() || undefined;

  await prisma.customFurnitureRequest.update({
    where: { id },
    data: { status },
  });

  await recordAudit({
    actorId: session.sub,
    action: "request.status_change",
    entity: "CustomFurnitureRequest",
    entityId: id,
    summary: `${request.name}: ${request.status} → ${status}${trimmedNote ? ` — ${trimmedNote}` : ""}`,
    metadata: { from: request.status, to: status, note: trimmedNote },
  });

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  return {};
}
