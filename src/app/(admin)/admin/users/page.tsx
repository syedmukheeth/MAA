import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { UserRoleTable } from "@/components/admin/UserRoleTable";

export default async function AdminUsersPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);

  // Explicit allow-list. Without it, Prisma returns every column and React
  // serialises the ACTUAL objects into the RSC payload sent to the browser —
  // not the five fields UserRow declares. That shipped passwordHash and
  // tokenVersion for up to 200 accounts to anyone who opened this page's
  // network tab. The narrow type on the client was never a defence; only the
  // query is.
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      erasedAt: true,
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">Users</h1>
      <UserRoleTable users={users} currentUserId={session.sub} />
    </div>
  );
}
