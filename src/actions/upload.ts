"use server";

import { headers } from "next/headers";
import { generateUploadSignature } from "@/lib/cloudinary";
import { requireRole } from "@/lib/auth/session";
import { uploadRatelimit } from "@/lib/redis";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export async function getProductImageUploadSignature() {
  await requireRole([...MANAGE_ROLES]);
  return generateUploadSignature("maa-furnitures/products");
}

export async function getComboImageUploadSignature() {
  await requireRole([...MANAGE_ROLES]);
  return generateUploadSignature("maa-furnitures/combos");
}

export async function getCustomRequestUploadSignature(): Promise<
  | { error: string }
  | ReturnType<typeof generateUploadSignature>
> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { success } = await uploadRatelimit.limit(`custom-request:${ip}`);
  if (!success) {
    return { error: "Too many uploads, please try again later." };
  }

  return generateUploadSignature("maa-furnitures/custom-requests");
}
