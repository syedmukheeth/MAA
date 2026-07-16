import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role === "CUSTOMER") {
    redirect("/login");
  }

  return (
    <div className="dark flex h-screen w-full max-w-full overflow-hidden bg-background text-foreground">
      <Sidebar role={user.role} />
      <div className="flex h-screen flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar email={user.email} role={user.role} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
