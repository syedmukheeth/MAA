import { redirect } from "next/navigation";
import { getActiveUser, CHANGE_PASSWORD_ROUTE } from "@/lib/auth/session";
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

  // Belt to the proxy's braces: the edge check reads a JWT claim that can be up
  // to seven days old, this one reads the User row. Pages that render without a
  // requireRole call are covered by it.
  if (user.pw) {
    redirect(CHANGE_PASSWORD_ROUTE);
  }

  // h-dvh, not h-screen: on mobile 100vh ignores the browser's collapsing
  // address bar, so the bottom of the scroll area sat under it.
  return (
    <div className="dark flex h-dvh w-full max-w-full overflow-hidden bg-background text-foreground">
      <Sidebar role={user.role} />
      <div className="flex h-dvh flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar email={user.email} role={user.role} />
        <main className="scrollbar-premium flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
