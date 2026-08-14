"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { testimonialSchema, type TestimonialInput } from "@/lib/validations/testimonial";
import { recordAudit } from "@/lib/audit";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { hasConsent } from "@/lib/privacy/consent";
import { PRIVACY_NOTICE_VERSION } from "@/lib/privacy/constants";

/**
 * Gate on publishing a named person's quote, photo and city.
 *
 * Publication is one of only two things this site does that genuinely runs on
 * consent under DPDP §6 — the customer gains nothing from it and it is not
 * needed to perform any contract, so there is no other lawful basis available.
 *
 * Two routes to a yes:
 *  - the customer has an account and granted TESTIMONIAL_PUBLICATION themselves
 *    on /account/privacy; or
 *  - a staff member attests they agreed offline, which writes a real
 *    ConsentRecord with source STAFF_RECORDED so the claim is attributable.
 *
 * Saving an unpublished draft is always allowed — the gate is on the transition
 * to published, not on recording that a customer said something nice.
 */
async function resolvePublishConsent(
  data: { isPublished: boolean; subjectUserId?: string; offlineConsentRecorded: boolean },
  staffId: string
): Promise<{ error?: string; consentRecordId?: string | null }> {
  if (!data.isPublished) return { consentRecordId: null };

  if (data.subjectUserId && (await hasConsent(data.subjectUserId, "TESTIMONIAL_PUBLICATION"))) {
    return {};
  }

  if (data.offlineConsentRecorded) {
    if (!data.subjectUserId) {
      return {
        error:
          "Link this testimonial to the customer's account before recording their consent, so they can withdraw it themselves later.",
      };
    }
    const record = await prisma.consentRecord.create({
      data: {
        userId: data.subjectUserId,
        purpose: "TESTIMONIAL_PUBLICATION",
        status: "GRANTED",
        noticeVersion: PRIVACY_NOTICE_VERSION,
        source: "STAFF_RECORDED",
      },
    });
    await recordAudit({
      actorId: staffId,
      action: "privacy.consent_grant",
      entity: "ConsentRecord",
      entityId: record.id,
      summary: "TESTIMONIAL_PUBLICATION recorded on the customer's behalf (offline consent)",
    });
    return { consentRecordId: record.id };
  }

  return {
    error:
      "You cannot publish a testimonial without the customer's consent. Link their account and either wait for them to agree in Account → Privacy, or tick the box confirming they agreed in person.",
  };
}

export async function createTestimonial(input: TestimonialInput): Promise<{ error?: string }> {
  const session = await requireRole([...ADMIN_ROLES]);
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const consent = await resolvePublishConsent(parsed.data, session.sub);
  if (consent.error) return { error: consent.error };

  const testimonial = await prisma.testimonial.create({
    data: {
      name: parsed.data.name,
      location: parsed.data.location || null,
      quote: parsed.data.quote,
      rating: parsed.data.rating,
      imageUrl: parsed.data.imageUrl || null,
      isPublished: parsed.data.isPublished,
      sortOrder: parsed.data.sortOrder,
      subjectUserId: parsed.data.subjectUserId || null,
      consentRecordId: consent.consentRecordId ?? null,
      createdById: session.sub,
    },
  });

  await recordAudit({
    actorId: session.sub,
    action: "testimonial.create",
    entity: "Testimonial",
    entityId: testimonial.id,
    summary: `Created testimonial for "${parsed.data.name}"`,
    metadata: { name: parsed.data.name, rating: parsed.data.rating, isPublished: parsed.data.isPublished },
  });

  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials");
}

export async function updateTestimonial(
  id: string,
  input: TestimonialInput
): Promise<{ error?: string }> {
  const session = await requireRole([...ADMIN_ROLES]);
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const before = await prisma.testimonial.findUnique({ where: { id } });
  if (!before) return { error: "Testimonial not found" };

  const consent = await resolvePublishConsent(parsed.data, session.sub);
  if (consent.error) return { error: consent.error };

  await prisma.testimonial.update({
    where: { id },
    data: {
      name: parsed.data.name,
      location: parsed.data.location || null,
      quote: parsed.data.quote,
      rating: parsed.data.rating,
      imageUrl: parsed.data.imageUrl || null,
      isPublished: parsed.data.isPublished,
      sortOrder: parsed.data.sortOrder,
      subjectUserId: parsed.data.subjectUserId || null,
      // Only overwrite when this edit minted a new record — an existing link
      // must survive an edit that leaves publication as it was.
      ...(consent.consentRecordId ? { consentRecordId: consent.consentRecordId } : {}),
    },
  });

  await recordAudit({
    actorId: session.sub,
    action: "testimonial.update",
    entity: "Testimonial",
    entityId: id,
    summary: `Updated testimonial for "${parsed.data.name}"`,
    metadata: {
      name: parsed.data.name,
      rating: parsed.data.rating,
      isPublished: parsed.data.isPublished,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials");
}

export async function deleteTestimonial(id: string): Promise<{ error?: string }> {
  const session = await requireRole([...ADMIN_ROLES]);
  const doomed = await prisma.testimonial.findUnique({
    where: { id },
    select: { name: true, rating: true },
  });
  if (!doomed) return { error: "Testimonial not found" };

  await prisma.testimonial.delete({ where: { id } });
  await recordAudit({
    actorId: session.sub,
    action: "testimonial.delete",
    entity: "Testimonial",
    entityId: id,
    summary: `Deleted testimonial for "${doomed.name}"`,
    metadata: { name: doomed.name, rating: doomed.rating },
  });

  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return {};
}

export async function toggleTestimonialPublished(
  id: string,
  isPublished: boolean
): Promise<{ error?: string }> {
  const session = await requireRole([...ADMIN_ROLES]);

  // The same consent gate as the full form. This toggle is the quickest route
  // to publication, so leaving it ungated would make the form's check
  // decorative. Unpublishing is always allowed and never blocked.
  if (isPublished) {
    const existing = await prisma.testimonial.findUnique({
      where: { id },
      select: { subjectUserId: true },
    });
    if (!existing) return { error: "Testimonial not found" };
    if (
      !existing.subjectUserId ||
      !(await hasConsent(existing.subjectUserId, "TESTIMONIAL_PUBLICATION"))
    ) {
      return {
        error:
          "This testimonial has no recorded consent to publish. Open it and link the customer's account first.",
      };
    }
  }

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: { isPublished },
  });
  await recordAudit({
    actorId: session.sub,
    action: "testimonial.update",
    entity: "Testimonial",
    entityId: id,
    summary: `${testimonial.name}'s testimonial ${isPublished ? "published" : "unpublished"}`,
    metadata: { isPublished },
  });
  revalidatePath("/");
  revalidatePath("/admin/testimonials");
  return {};
}
