"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { testimonialSchema, type TestimonialInput } from "@/lib/validations/testimonial";
import { recordAudit } from "@/lib/audit";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

export async function createTestimonial(input: TestimonialInput): Promise<{ error?: string }> {
  const session = await requireRole([...MANAGE_ROLES]);
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const testimonial = await prisma.testimonial.create({
    data: {
      name: parsed.data.name,
      location: parsed.data.location || null,
      quote: parsed.data.quote,
      rating: parsed.data.rating,
      imageUrl: parsed.data.imageUrl || null,
      isPublished: parsed.data.isPublished,
      sortOrder: parsed.data.sortOrder,
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
  const session = await requireRole([...MANAGE_ROLES]);
  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const before = await prisma.testimonial.findUnique({ where: { id } });
  if (!before) return { error: "Testimonial not found" };

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
  const session = await requireRole([...MANAGE_ROLES]);
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
  const session = await requireRole([...MANAGE_ROLES]);
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
