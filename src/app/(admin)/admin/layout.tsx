import { redirect } from "next/navigation";
import { getActiveUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getActiveUser();

  if (!user || user.role === "CUSTOMER") {
    redirect("/login");
  }

  // h-dvh, not h-screen: on mobile 100vh ignores the browser's collapsing
  // address bar, so the bottom of the scroll area sat under it.
  return (
    <div className="dark flex h-dvh w-full max-w-full overflow-hidden bg-background text-foreground">
      <Sidebar role={user.role} />
      <div className="flex h-dvh flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar email={user.email} role={user.role} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
