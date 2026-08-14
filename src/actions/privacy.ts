"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAuth, SESSION_COOKIE } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/audit";
import { clientIp, limitOrAllow } from "@/lib/rate-limit";
import {
  dataExportRatelimit,
  privacyRequestRatelimit,
  grievanceRatelimit,
} from "@/lib/redis";
import { sendEmail } from "@/lib/email";
import {
  erasureScheduledHtml,
  erasureCompletedHtml,
  grievanceAcknowledgedHtml,
  grievanceNotificationHtml,
  privacyRequestReceivedHtml,
} from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { buildDataExport, serialiseExport } from "@/lib/privacy/export";
import {
  ERASURE_COOLING_OFF_DAYS,
  GRIEVANCE_OFFICER,
  GRIEVANCE_SLA_DAYS,
  OPEN_ORDER_STATUSES,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/privacy/constants";
import {
  consentToggleSchema,
  correctionRequestSchema,
  erasureRequestSchema,
  grievanceSchema,
  publicGrievanceSchema,
  GRIEVANCE_CATEGORY_LABELS,
  CORRECTION_FIELD_LABELS,
  type ConsentToggleInput,
  type CorrectionRequestInput,
  type ErasureRequestInput,
  type GrievanceInput,
  type PublicGrievanceInput,
} from "@/lib/validations/privacy";

/**
 * Data-principal rights under the DPDP Act 2023.
 *
 * Every exported action in this file starts with `requireAuth()` and scopes
 * every query by `session.sub`. No action here accepts a user id from the
 * caller — that is the entire IDOR surface of the privacy features, and closing
 * it by construction is cheaper than checking ownership in six places.
 *
 * The irreversible half of erasure lives in lib/privacy/erasure.ts, not here.
 * It takes a user id as its argument, and every export from a "use server"
 * module is a client-callable endpoint — exporting it from this file would
 * publish "delete any account by id" to the internet. Only the cron route and
 * the OWNER-gated admin action may reach it.
 */

type ActionResult = { success?: boolean; error?: string; message?: string };

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

/**
 * Records a consent decision by appending to the log.
 *
 * Withdrawal takes exactly the same path as granting — one toggle, no
 * confirmation dialog, no "are you sure you'll miss out" interstitial. DPDP
 * §6(6) requires withdrawal to be as easy as giving, and a retention-offer
 * modal is the dark pattern that requirement exists to forbid.
 */
export async function setConsent(
  input: ConsentToggleInput
): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = consentToggleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }
  const { purpose, granted } = parsed.data;

  await prisma.consentRecord.create({
    data: {
      userId: session.sub,
      purpose,
      status: granted ? "GRANTED" : "WITHDRAWN",
      noticeVersion: PRIVACY_NOTICE_VERSION,
      source: "ACCOUNT_PRIVACY_PAGE",
      withdrawnAt: granted ? null : new Date(),
    },
  });

  // Withdrawing testimonial consent must take effect immediately, not when a
  // staff member next looks at the queue — the whole point of the right is that
  // the customer stops seeing their name on the site.
  if (purpose === "TESTIMONIAL_PUBLICATION" && !granted) {
    await prisma.testimonial.updateMany({
      where: { subjectUserId: session.sub },
      data: { isPublished: false },
    });
    revalidatePath("/");
  }

  await recordAudit({
    actorId: session.sub,
    action: granted ? "privacy.consent_grant" : "privacy.consent_withdraw",
    entity: "ConsentRecord",
    entityId: session.sub,
    summary: `${purpose} ${granted ? "granted" : "withdrawn"}`,
  });

  revalidatePath("/account/privacy");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Access / portability
// ---------------------------------------------------------------------------

export async function exportMyData(): Promise<
  { error: string } | { success: true; filename: string; json: string }
> {
  const session = await requireAuth();

  const allowed = await limitOrAllow(
    dataExportRatelimit,
    `data-export:${session.sub}`
  );
  if (!allowed) {
    return {
      error:
        "You have already downloaded your data a few times today. Please try again tomorrow.",
    };
  }

  const data = await buildDataExport(session.sub);

  await recordAudit({
    actorId: session.sub,
    action: "privacy.export",
    entity: "User",
    entityId: session.sub,
    summary: "Data export downloaded",
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    success: true,
    filename: `maa-furniture-my-data-${stamp}.json`,
    json: serialiseExport(data),
  };
}

// ---------------------------------------------------------------------------
// Correction
// ---------------------------------------------------------------------------

/**
 * Raises a correction ticket for the things the principal cannot change alone.
 *
 * Name and password are self-service through updateProfile and the UI links
 * there instead of duplicating them here. What lands in this queue is email
 * (the login identifier, embedded in issued JWTs) and past-order shipping
 * details (part of a tax invoice) — both need a human, and saying so is better
 * than a form that appears to work and quietly changes nothing.
 */
export async function requestCorrection(
  input: CorrectionRequestInput
): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = correctionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const allowed = await limitOrAllow(
    privacyRequestRatelimit,
    `privacy-request:${session.sub}`
  );
  if (!allowed) {
    return { error: "Too many requests today. Please try again tomorrow." };
  }

  const label = CORRECTION_FIELD_LABELS[parsed.data.field];
  await prisma.privacyRequest.create({
    data: {
      userId: session.sub,
      type: "CORRECTION",
      note: `${label}: ${parsed.data.detail}`,
    },
  });

  await recordAudit({
    actorId: session.sub,
    action: "privacy.correction",
    entity: "PrivacyRequest",
    entityId: session.sub,
    summary: `Correction requested: ${parsed.data.field}`,
  });

  await sendEmail({
    to: session.email,
    subject: "We received your correction request",
    html: privacyRequestReceivedHtml({
      requestType: "correction",
      slaDays: GRIEVANCE_SLA_DAYS,
    }),
  });

  revalidatePath("/account/privacy");
  return {
    success: true,
    message: `We have logged your request and will respond within ${GRIEVANCE_SLA_DAYS} days.`,
  };
}

// ---------------------------------------------------------------------------
// Grievance
// ---------------------------------------------------------------------------

export async function submitGrievance(
  input: GrievanceInput
): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = grievanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const allowed = await limitOrAllow(grievanceRatelimit, `grievance:${session.sub}`);
  if (!allowed) {
    return { error: "Too many complaints submitted today. Please try again tomorrow." };
  }

  const label = GRIEVANCE_CATEGORY_LABELS[parsed.data.category];
  await prisma.privacyRequest.create({
    data: {
      userId: session.sub,
      type: "GRIEVANCE",
      note: `${label}: ${parsed.data.body}`,
    },
  });

  await recordAudit({
    actorId: session.sub,
    action: "privacy.grievance",
    entity: "PrivacyRequest",
    entityId: session.sub,
    summary: `Grievance raised: ${parsed.data.category}`,
  });

  await Promise.all([
    sendEmail({
      to: GRIEVANCE_OFFICER.email,
      subject: "New privacy grievance",
      html: grievanceNotificationHtml({
        category: label,
        body: parsed.data.body,
        adminUrl: `${getSiteUrl()}/admin/privacy`,
      }),
    }),
    sendEmail({
      to: session.email,
      subject: "We received your complaint",
      html: grievanceAcknowledgedHtml({
        slaDays: GRIEVANCE_SLA_DAYS,
        officerName: GRIEVANCE_OFFICER.name,
      }),
    }),
  ]);

  revalidatePath("/account/privacy");
  return {
    success: true,
    message: `Your complaint has been logged. We will respond within ${GRIEVANCE_SLA_DAYS} days.`,
  };
}

/**
 * Grievances from people who cannot sign in.
 *
 * Two groups need this and neither can use the action above: someone who never
 * had an account but whose data we hold anyway (a testimonial naming them, a
 * phone number on a walk-in order), and someone whose account we locked when
 * they asked for erasure and who now wants to cancel within the cooling-off
 * window. DPDP §13 requires a reachable grievance channel; a channel that
 * requires the account you are complaining about is not one.
 *
 * Rate-limited by IP because there is no session to key on, and the endpoint
 * sends mail. If the address matches an existing account the row is attached to
 * it, so the reply address is not stored a second time.
 */
export async function submitPublicGrievance(
  input: PublicGrievanceInput
): Promise<ActionResult> {
  const parsed = publicGrievanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const allowed = await limitOrAllow(
    grievanceRatelimit,
    `grievance-public:${await clientIp()}`
  );
  if (!allowed) {
    return { error: "Too many complaints submitted. Please try again tomorrow." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  const label = GRIEVANCE_CATEGORY_LABELS[parsed.data.category];
  await prisma.privacyRequest.create({
    data: {
      // Attach to the account when we can, so staff see it alongside that
      // person's other requests and we avoid holding the address twice.
      userId: existing?.id ?? null,
      contactEmail: existing ? null : email,
      type: "GRIEVANCE",
      note: `${label}: ${parsed.data.body}`,
    },
  });

  await Promise.all([
    sendEmail({
      to: GRIEVANCE_OFFICER.email,
      subject: "New privacy grievance (public form)",
      html: grievanceNotificationHtml({
        category: label,
        body: parsed.data.body,
        adminUrl: `${getSiteUrl()}/admin/privacy`,
      }),
    }),
    sendEmail({
      to: email,
      subject: "We received your complaint",
      html: grievanceAcknowledgedHtml({
        slaDays: GRIEVANCE_SLA_DAYS,
        officerName: GRIEVANCE_OFFICER.name,
      }),
    }),
  ]);

  return {
    success: true,
    message: `Your complaint has been logged. We will reply to ${email} within ${GRIEVANCE_SLA_DAYS} days.`,
  };
}

// ---------------------------------------------------------------------------
// Erasure — step A: request
// ---------------------------------------------------------------------------

export async function requestErasure(
  input: ErasureRequestInput
): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = erasureRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const allowed = await limitOrAllow(
    privacyRequestRatelimit,
    `privacy-request:${session.sub}`
  );
  if (!allowed) {
    return { error: "Too many requests today. Please try again tomorrow." };
  }

  // A session alone must not be enough to destroy an account. Same reasoning as
  // the password change in actions/profile.ts, and more important here: this
  // one cannot be undone by the real owner afterwards.
  const account = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { passwordHash: true, role: true, email: true },
  });
  if (!account) return { error: "Account not found." };
  if (!(await verifyPassword(parsed.data.currentPassword, account.passwordHash))) {
    return { error: "That password is not correct." };
  }

  // Staff accounts are excluded. Erasing one has to consider the last-owner
  // guard, role handover, and the audit trail that account authored — none of
  // which belongs in a self-service button.
  if (account.role !== "CUSTOMER") {
    return {
      error:
        "Staff accounts cannot be deleted from here. Please raise a request with the grievance officer so ownership and audit history can be handed over first.",
    };
  }

  // An order still in flight means the contract is live and we still need the
  // delivery details to perform it (DPDP §12(3)). The request is recorded
  // rather than refused, so the queue shows it and staff can complete it once
  // the order closes.
  const openOrders = await prisma.order.count({
    where: { userId: session.sub, status: { in: [...OPEN_ORDER_STATUSES] } },
  });
  if (openOrders > 0) {
    await prisma.privacyRequest.create({
      data: {
        userId: session.sub,
        type: "ERASURE",
        status: "ON_HOLD",
        note: `Held: ${openOrders} order(s) still in progress at time of request.`,
      },
    });
    await recordAudit({
      actorId: session.sub,
      action: "privacy.erasure_blocked",
      entity: "User",
      entityId: session.sub,
      summary: `Erasure on hold: ${openOrders} open order(s)`,
    });
    revalidatePath("/account/privacy");
    return {
      success: true,
      message: `You have ${openOrders} order(s) still on the way. We have recorded your deletion request and will complete it once they are delivered or cancelled — you do not need to ask again.`,
    };
  }

  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + ERASURE_COOLING_OFF_DAYS);

  // Lock the account in the same transaction that schedules the wipe. The
  // cooling-off period protects against an accidental deletion; it must not
  // also mean the data keeps being used for a week.
  await prisma.$transaction([
    prisma.privacyRequest.create({
      data: {
        userId: session.sub,
        type: "ERASURE",
        status: "PENDING",
        scheduledFor,
      },
    }),
    prisma.user.update({
      where: { id: session.sub },
      data: { isActive: false, tokenVersion: { increment: 1 } },
    }),
  ]);

  await recordAudit({
    actorId: session.sub,
    action: "privacy.erasure_request",
    entity: "User",
    entityId: session.sub,
    summary: `Erasure scheduled for ${scheduledFor.toISOString().slice(0, 10)}`,
  });

  await sendEmail({
    to: account.email,
    subject: "Your MAA FURNITURE account is scheduled for deletion",
    html: erasureScheduledHtml({
      scheduledFor,
      coolingOffDays: ERASURE_COOLING_OFF_DAYS,
      grievanceUrl: `${getSiteUrl()}/grievance`,
    }),
  });

  const store = await cookies();
  store.delete(SESSION_COOKIE);

  return {
    success: true,
    message: "Your account has been locked and will be deleted shortly.",
  };
}
