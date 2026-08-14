import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { erasureCompletedHtml } from "@/lib/email-templates";
import { destroyUpload } from "@/lib/cloudinary";
import {
  anonymisedCustomRequestFields,
  anonymisedOrderFields,
  tombstoneUserFields,
} from "./anonymise";
import { OPEN_ORDER_STATUSES, ORDER_RETENTION_YEARS } from "./constants";

/**
 * Erasure execution — the irreversible half.
 *
 * Deliberately a plain module, NOT a "use server" file. Every export from a
 * server-action module becomes a client-callable RPC endpoint, and this
 * function takes a user id as its only argument: exporting it from an action
 * file would publish "delete any account by id" to the internet. It lives here
 * so the only ways to reach it are the cron route and the OWNER-gated admin
 * action, both of which authorise first.
 *
 * The request half — the customer-facing button, its password re-check and the
 * cooling-off scheduling — is in actions/privacy.ts.
 */

export type ErasureOutcome = {
  erased: boolean;
  reason?: string;
  imagesPurged: number;
  imagesFailed: number;
};

/**
 * Irreversibly erases one user. NOT exported to any client boundary.
 *
 * Callers: the nightly cron once the cooling-off window closes, and the
 * OWNER-only override in actions/admin-privacy.ts. Both re-authorise before
 * calling; this function assumes the decision has already been made and only
 * re-checks the facts that could have changed since the request was filed.
 *
 * Ordering inside the transaction matters and is explained inline. The short
 * version: children before parents, disposable rows before anonymised ones, and
 * the User row last — Order.userId, Cart.userId and AuditLog.actorId are all
 * onDelete: Restrict, so the anchor must outlive everything pointing at it.
 */
export async function executeErasure(userId: string): Promise<ErasureOutcome> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, erasedAt: true },
  });

  if (!user) return { erased: false, reason: "not-found", imagesPurged: 0, imagesFailed: 0 };
  if (user.erasedAt) {
    return { erased: false, reason: "already-erased", imagesPurged: 0, imagesFailed: 0 };
  }
  if (user.role !== "CUSTOMER") {
    return { erased: false, reason: "staff-account", imagesPurged: 0, imagesFailed: 0 };
  }

  // Re-check rather than trust the request: an order can have been placed in
  // the days between asking and the cron running.
  const openOrders = await prisma.order.count({
    where: { userId, status: { in: [...OPEN_ORDER_STATUSES] } },
  });
  if (openOrders > 0) {
    await prisma.privacyRequest.updateMany({
      where: { userId, type: "ERASURE", status: "PENDING" },
      data: {
        status: "ON_HOLD",
        note: `Held at execution time: ${openOrders} open order(s).`,
      },
    });
    return { erased: false, reason: "open-orders", imagesPurged: 0, imagesFailed: 0 };
  }

  // Captured before the transaction. After it commits the email is a tombstone
  // and these rows no longer carry the URLs, so there would be nothing left to
  // send to or purge.
  const originalEmail = user.email;
  const [requestImages, testimonialImages] = await Promise.all([
    prisma.customFurnitureRequest.findMany({
      where: { submittedById: userId },
      select: { imageUrl: true },
    }),
    prisma.testimonial.findMany({
      where: { subjectUserId: userId },
      select: { imageUrl: true },
    }),
  ]);
  const imageUrls = [...requestImages, ...testimonialImages]
    .map((r) => r.imageUrl)
    .filter((url): url is string => Boolean(url));

  await prisma.$transaction(async (tx) => {
    // 1-3. Cart tree. Cart.user has NO onDelete, so it is Restrict — these
    // deletes are mandatory, not belt-and-braces. CartItem and
    // CartComboSelection do cascade from Cart, but are deleted explicitly so
    // the order of operations is readable without consulting the schema.
    await tx.cartComboSelection.deleteMany({
      where: { cartItem: { cart: { userId } } },
    });
    await tx.cartItem.deleteMany({ where: { cart: { userId } } });
    await tx.cart.deleteMany({ where: { userId } });

    // 4. Saved addresses have no retention basis once the account is gone.
    await tx.address.deleteMany({ where: { userId } });

    // 5 before 6, deliberately: delete the requests that go entirely, THEN
    // anonymise what remains. Reversed, step 6 would rewrite rows that step 5
    // is about to delete.
    await tx.customFurnitureRequest.deleteMany({
      where: { submittedById: userId, status: { not: "CONVERTED" } },
    });
    await tx.customFurnitureRequest.updateMany({
      where: { submittedById: userId },
      data: anonymisedCustomRequestFields(),
    });

    // 7. Published testimonials naming this person come down entirely.
    await tx.testimonial.deleteMany({ where: { subjectUserId: userId } });

    // 8. Orders survive as accounting records with the recipient removed.
    await tx.order.updateMany({
      where: { userId },
      data: anonymisedOrderFields(),
    });

    // 9. Audit rows ABOUT this user keep their action and timestamp — they are
    // the internal control over staff — but lose the identifying text. Raw SQL
    // because Prisma cannot delete a single key from a JSONB column.
    await tx.$executeRaw`
      UPDATE "AuditLog"
      SET "summary"  = '[erased]',
          "metadata" = "metadata" - 'targetEmail'
      WHERE "entity" = 'User' AND "entityId" = ${userId}
    `;

    // 10. Consent records are kept as evidence of the basis we processed on,
    // flipped to withdrawn. Deleting them would destroy our own defence.
    await tx.consentRecord.updateMany({
      where: { userId, status: "GRANTED" },
      data: { status: "WITHDRAWN", withdrawnAt: new Date() },
    });

    // 11. Close the request that triggered this.
    await tx.privacyRequest.updateMany({
      where: { userId, type: "ERASURE", status: { in: ["PENDING", "ON_HOLD"] } },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    // 12. The anchor, last. Everything above still references it.
    await tx.user.update({
      where: { id: userId },
      data: tombstoneUserFields(userId),
    });

    // 13. Inside the transaction so the log lands or rolls back with the wipe.
    // actorId resolves against the row tombstoned one statement earlier — it is
    // updated, never deleted, so the FK holds.
    await recordAudit(
      {
        actorId: userId,
        action: "privacy.erasure_complete",
        entity: "User",
        entityId: userId,
        summary: "Personal data erased; order records anonymised and retained",
      },
      tx
    );
  });

  // Post-commit only. An external HTTP call inside a Prisma transaction pins a
  // pooler connection for the round-trip and cannot be rolled back anyway; and
  // a Cloudinary outage must not be reported to the principal as a failed
  // erasure when their database records are already gone.
  let imagesPurged = 0;
  let imagesFailed = 0;
  for (const url of imageUrls) {
    if (await destroyUpload(url)) imagesPurged += 1;
    else imagesFailed += 1;
  }

  if (imagesFailed > 0) {
    await recordAudit({
      actorId: userId,
      action: "privacy.erasure_purge_failed",
      entity: "User",
      entityId: userId,
      summary: `${imagesFailed} uploaded image(s) could not be deleted from Cloudinary`,
      metadata: { imagesFailed, imagesPurged },
    });
  }

  await sendEmail({
    to: originalEmail,
    subject: "Your data has been deleted",
    html: erasureCompletedHtml({ retentionYears: ORDER_RETENTION_YEARS }),
  });

  revalidatePath("/");
  return { erased: true, imagesPurged, imagesFailed };
}
