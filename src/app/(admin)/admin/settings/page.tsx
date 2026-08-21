import { requireRole } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";
import { ADMIN_ROLES } from "@/lib/auth/roles";

export default async function AdminSettingsPage() {
  const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">
        Website Settings
      </h1>
      <SiteSettingsForm
        defaults={settings}
        canEditCommerce={(ADMIN_ROLES as readonly string[]).includes(session.role)}
      />
    </div>
  );
}
