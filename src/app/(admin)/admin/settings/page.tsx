import { requireRole } from "@/lib/auth/session";
import { getSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm";

export default async function AdminSettingsPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">
        Website Settings
      </h1>
      <SiteSettingsForm defaults={settings} />
    </div>
  );
}
