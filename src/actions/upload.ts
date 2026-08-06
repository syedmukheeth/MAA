"use server";


import { generateUploadSignature } from "@/lib/cloudinary";
import { requireRole, requireAuth } from "@/lib/auth/session";
import { uploadRatelimit } from "@/lib/redis";

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

  const { success } = await uploadRatelimit.limit(`custom-request:${session.sub}`);
  if (!success) {
    return { error: "Too many uploads, please try again later." };
  }

  return generateUploadSignature("maa-furniture/custom-requests");
}
