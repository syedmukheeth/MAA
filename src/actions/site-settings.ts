"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { SETTINGS_ID } from "@/lib/site-settings";
import {
  siteSettingsSchema,
  type SiteSettingsInput,
} from "@/lib/validations/site-settings";

export async function updateSiteSettings(
  input: SiteSettingsInput
): Promise<{ error?: string }> {
  await requireRole(["OWNER", "ADMIN"]);

  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...parsed.data },
    update: { ...parsed.data },
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  return {};
}
