import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { UserRoleTable } from "@/components/admin/UserRoleTable";

export default async function AdminUsersPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">Users</h1>
      <UserRoleTable users={users} currentUserId={session.sub} />
    </div>
  );
}
