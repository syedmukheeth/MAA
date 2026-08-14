"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { recordAudit } from "@/lib/audit";
import { executeErasure } from "@/lib/privacy/erasure";
import { destroyUpload } from "@/lib/cloudinary";
import type { PrivacyRequestStatus } from "@/generated/prisma/client";

/**
 * Staff handling of data-principal requests.
 *
 * Gated to OWNER + ADMIN, not MANAGER: everything here either resolves a
 * statutory obligation with a 30-day clock or irreversibly destroys the
 * identifying half of an order record. Every action writes an audit entry,
 * because "who approved this deletion" is exactly the question that gets asked
 * after the fact.
 */

type Result = { error?: string; success?: boolean; message?: string };

export async function updatePrivacyRequestStatus(
  id: string,
  status: PrivacyRequestStatus,
  resolution?: string
): Promise<Result> {
  const session = await requireRole([...ADMIN_ROLES]);

  const existing = await prisma.privacyRequest.findUnique({
    where: { id },
    select: { type: true, status: true },
  });
  if (!existing) return { error: "Request not found." };

  // Erasures are not completed by editing a dropdown. Marking one COMPLETED
  // without running the wipe would leave the queue claiming a deletion that
  // never happened — the worst possible failure mode for this table.
  if (existing.type === "ERASURE" && status === "COMPLETED") {
    return {
      error:
        "Use “Erase now” to complete a deletion. Setting the status by hand would record it as done without deleting anything.",
    };
  }

  await prisma.privacyRequest.update({
    where: { id },
    data: {
      status,
      resolution: resolution?.trim() || undefined,
      completedAt:
        status === "COMPLETED" || status === "REJECTED" ? new Date() : null,
    },
  });

  await recordAudit({
    actorId: session.sub,
    action: "privacy.request_status_change",
    entity: "PrivacyRequest",
    entityId: id,
    summary: `${existing.type}: ${existing.status} → ${status}`,
  });

  revalidatePath("/admin/privacy");
  return { success: true };
}

/**
 * Restores an account whose owner changed their mind inside the cooling-off
 * window. Only possible while the request is still PENDING — once the cron has
 * run there is nothing left to restore.
 */
export async function cancelScheduledErasure(
  id: string,
  reason: string
): Promise<Result> {
  const session = await requireRole([...ADMIN_ROLES]);

  const request = await prisma.privacyRequest.findUnique({
    where: { id },
    select: { userId: true, type: true, status: true },
  });
  if (!request || request.type !== "ERASURE") {
    return { error: "Deletion request not found." };
  }
  if (request.status !== "PENDING" && request.status !== "ON_HOLD") {
    return { error: "This request is no longer pending and cannot be cancelled." };
  }
  if (!request.userId) return { error: "This request has no account attached." };

  await prisma.$transaction([
    prisma.privacyRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        resolution: reason.trim() || "Cancelled at the customer's request.",
        completedAt: new Date(),
      },
    }),
    // Unlock the account. tokenVersion is deliberately NOT rolled back — the
    // sessions invalidated when the request was made stay invalidated, so the
    // customer signs in fresh rather than an old cookie springing back to life.
    prisma.user.update({
      where: { id: request.userId },
      data: { isActive: true },
    }),
  ]);

  await recordAudit({
    actorId: session.sub,
    action: "privacy.erasure_cancel",
    entity: "User",
    entityId: request.userId,
    summary: "Scheduled erasure cancelled; account restored",
  });

  revalidatePath("/admin/privacy");
  return { success: true, message: "Account restored." };
}

/**
 * Runs the erasure immediately instead of waiting for the cron.
 *
 * OWNER only. The cooling-off window exists to make an accidental deletion
 * recoverable; skipping it removes that safety net, so the decision sits with
 * the one role that cannot be granted by another staff member.
 */
export async function executeErasureNow(
  id: string,
  confirmation: string
): Promise<Result> {
  const session = await requireRole(["OWNER"]);

  if (confirmation !== "ERASE NOW") {
    return { error: 'Type "ERASE NOW" to confirm.' };
  }

  const request = await prisma.privacyRequest.findUnique({
    where: { id },
    select: { userId: true, type: true, status: true },
  });
  if (!request || request.type !== "ERASURE") {
    return { error: "Deletion request not found." };
  }
  if (!request.userId) return { error: "This request has no account attached." };
  if (request.status === "COMPLETED") {
    return { error: "This deletion has already been carried out." };
  }

  const outcome = await executeErasure(request.userId);

  if (!outcome.erased) {
    const reasons: Record<string, string> = {
      "not-found": "That account no longer exists.",
      "already-erased": "That account has already been erased.",
      "staff-account":
        "Staff accounts must be handed over and demoted before they can be erased.",
      "open-orders":
        "That customer has an order still in progress. The request has been put on hold and will complete once the order closes.",
    };
    return {
      error: reasons[outcome.reason ?? ""] ?? "The deletion could not be carried out.",
    };
  }

  await recordAudit({
    actorId: session.sub,
    action: "privacy.erasure_complete",
    entity: "User",
    entityId: request.userId,
    summary: "Erasure executed early by owner override",
  });

  revalidatePath("/admin/privacy");
  return {
    success: true,
    message:
      outcome.imagesFailed > 0
        ? `Data erased. ${outcome.imagesFailed} image(s) could not be removed from Cloudinary — retry from this page.`
        : "Data erased.",
  };
}

/**
 * Retries Cloudinary deletions that failed after an erasure committed.
 *
 * The image URLs are gone from the database by then, so the only record of what
 * failed is the audit entry written at the time. This walks any custom-request
 * rows still holding an image for an erased account — the realistic failure is
 * a partial purge, where some rows were nulled and some were not.
 */
export async function retryCloudinaryPurge(userId: string): Promise<Result> {
  const session = await requireRole([...ADMIN_ROLES]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { erasedAt: true },
  });
  if (!user?.erasedAt) {
    return { error: "That account has not been erased." };
  }

  const stragglers = await prisma.customFurnitureRequest.findMany({
    where: { submittedById: userId, imageUrl: { not: null } },
    select: { id: true, imageUrl: true },
  });

  let purged = 0;
  let failed = 0;
  for (const row of stragglers) {
    if (row.imageUrl && (await destroyUpload(row.imageUrl))) {
      await prisma.customFurnitureRequest.update({
        where: { id: row.id },
        data: { imageUrl: null },
      });
      purged += 1;
    } else {
      failed += 1;
    }
  }

  await recordAudit({
    actorId: session.sub,
    action: "privacy.erasure_purge_failed",
    entity: "User",
    entityId: userId,
    summary: `Cloudinary purge retried: ${purged} removed, ${failed} still failing`,
  });

  revalidatePath("/admin/privacy");
  return {
    success: true,
    message:
      failed > 0
        ? `${purged} removed, ${failed} still failing. Check Cloudinary credentials.`
        : `${purged} image(s) removed. Nothing left to purge.`,
  };
}
