"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { recordAudit, diff } from "@/lib/audit";
import { STAFF_ROLES, ADMIN_ROLES } from "@/lib/auth/roles";
import { SETTINGS_ID } from "@/lib/site-settings";
import {
  siteSettingsSchema,
  type SiteSettingsInput,
} from "@/lib/validations/site-settings";

/**
 * Settings that decide where money goes or how much of it is charged.
 *
 * A MANAGER edits shop content — headlines, hours, FAQ, images. These are a
 * different kind of field: `upiId` is the account every UPI payment lands in,
 * and `gstRate` rewrites the tax on every future invoice. Swapping the UPI ID
 * for a personal one left nothing behind but an audit row.
 */
const COMMERCE_FIELDS = [
  "gstRate",
  "deliveryFee",
  "freeDeliveryThreshold",
  "upiId",
  "upiQrImage",
  "allowPurchases",
  "allowCOD",
  "allowUPI",
] as const satisfies readonly (keyof SiteSettingsInput)[];

export async function updateSiteSettings(
  input: SiteSettingsInput
): Promise<{ error?: string; notice?: string }> {
  const session = await requireRole([...STAFF_ROLES]);

  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const canEditCommerce = (ADMIN_ROLES as readonly string[]).includes(session.role);

  const before = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });

  // A MANAGER's save goes through — minus the commerce block. Failing the whole
  // form would mean they cannot fix a typo in the hero headline.
  const data: Record<string, unknown> = { ...parsed.data };
  const droppedFields: string[] = [];
  if (!canEditCommerce) {
    for (const field of COMMERCE_FIELDS) {
      if (!before) {
        // No row yet: there is nothing to preserve, so let the schema defaults
        // create it rather than writing an incomplete row.
        continue;
      }
      const current = (before as unknown as Record<string, unknown>)[field];
      const submitted = data[field];
      const changedIt =
        String(submitted ?? "") !== String(current ?? "");
      delete data[field];
      if (changedIt) droppedFields.push(field);
    }
  }

  try {
    await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...parsed.data },
      update: data,
    });
  } catch (e) {
    console.error("updateSiteSettings failed", e);
    return {
      error:
        "Could not save settings. If this keeps happening the database may be missing a recent migration.",
    };
  }

  const changed = before
    ? diff(before as unknown as Record<string, unknown>, data)
    : {};

  await recordAudit({
    actorId: session.sub,
    action: "settings.update",
    entity: "SiteSettings",
    entityId: SETTINGS_ID,
    summary: before
      ? `Changed ${Object.keys(changed).length || "no"} setting(s)`
      : "Created site settings",
    metadata: { ...changed, refusedCommerceFields: droppedFields },
  });

  revalidatePath("/");
  revalidatePath("/admin/settings");
  // The custom-studio form (woods/finishes/budgets/features) and the shop
  // filter pills live on their own cached routes — revalidate them too, or
  // admin edits appear "not saved" until the 5-min cache expires.
  revalidatePath("/custom-studio");
  revalidatePath("/products");
  // The showroom page renders the FAQ and contact details from these settings
  // and caches for 5 minutes; without this an edit looks like it did not save.
  revalidatePath("/showroom");
  if (droppedFields.length > 0) {
    return {
      notice: `Saved. Pricing and payment settings (${droppedFields.join(", ")}) were not changed — only an owner or admin can edit those.`,
    };
  }
  return {};
}
