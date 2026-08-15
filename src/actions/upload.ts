"use server";


import { generateUploadSignature } from "@/lib/cloudinary";
import { requireRole, requireAuth } from "@/lib/auth/session";
import { uploadRatelimit } from "@/lib/redis";
import { limitOrAllow } from "@/lib/rate-limit";

import { STAFF_ROLES, ADMIN_ROLES } from "@/lib/auth/roles";

export async function getProductImageUploadSignature() {
  await requireRole([...STAFF_ROLES]);
  return generateUploadSignature("maa-furniture/products");
}

export async function getComboImageUploadSignature() {
  await requireRole([...STAFF_ROLES]);
  return generateUploadSignature("maa-furniture/combos");
}

export async function getTestimonialImageUploadSignature() {
  await requireRole([...ADMIN_ROLES]);
  return generateUploadSignature("maa-furniture/testimonials");
}

export async function getCustomRequestUploadSignature(): Promise<
  | { error: string }
  | ReturnType<typeof generateUploadSignature>
> {
  // Require authentication to prevent anonymous Cloudinary storage abuse.
  // The custom request form already requires a logged-in user.
  const session = await requireAuth();

  // Through the shared helper, not uploadRatelimit.limit() directly: a raw
  // .limit() rejects when Upstash is unreachable and throws out of the action,
  // where every other rate-limited path in the app degrades to the in-memory
  // limiter instead.
  const allowed = await limitOrAllow(
    uploadRatelimit,
    `custom-request:${session.sub}`
  );
  if (!allowed) {
    return { error: "Too many uploads, please try again later." };
  }

  return generateUploadSignature("maa-furniture/custom-requests");
}
