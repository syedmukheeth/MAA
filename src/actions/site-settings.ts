"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { recordAudit, diff } from "@/lib/audit";
import { SETTINGS_ID } from "@/lib/site-settings";
import {
  siteSettingsSchema,
  type SiteSettingsInput,
} from "@/lib/validations/site-settings";

export async function updateSiteSettings(
  input: SiteSettingsInput
): Promise<{ error?: string }> {
  const session = await requireRole(["OWNER", "ADMIN"]);

  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const before = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });

  try {
    await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...parsed.data },
      update: { ...parsed.data },
    });
  } catch (e) {
    console.error("updateSiteSettings failed", e);
    return {
      error:
        "Could not save settings. If this keeps happening the database may be missing a recent migration.",
    };
  }

  const changed = before
    ? diff(before as unknown as Record<string, unknown>, parsed.data)
    : {};

  await recordAudit({
    actorId: session.sub,
    action: "settings.update",
    entity: "SiteSettings",
    entityId: SETTINGS_ID,
    summary: before
      ? `Changed ${Object.keys(changed).length || "no"} setting(s)`
      : "Created site settings",
    metadata: changed,
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  // The custom-studio form (woods/finishes/budgets/features) and the shop
  // filter pills live on their own cached routes — revalidate them too, or
  // admin edits appear "not saved" until the 5-min cache expires.
  revalidatePath("/custom-studio");
  revalidatePath("/products");
  return {};
}
