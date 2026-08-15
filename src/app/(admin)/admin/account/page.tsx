import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

/**
 * Staff self-service password change.
 *
 * Customers have this under /account, but src/proxy.ts redirects staff away from
 * that area — so without this page the only way a staff member could change
 * their own password was the emailed reset link.
 */
export default async function AdminAccountPage() {
  const session = await requireRole([...STAFF_ROLES]);

  const account = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, email: true, role: true, passwordChangedAt: true },
  });

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-heading text-2xl text-foreground">My Account</h1>

      <dl className="rounded-xl border border-border bg-card p-5 text-sm">
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="text-foreground">{account?.name}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="text-foreground break-all">{account?.email}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize text-foreground">
            {account?.role.toLowerCase()}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-muted-foreground">Password last changed</dt>
          <dd className="text-foreground">
            {account?.passwordChangedAt
              ? account.passwordChangedAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Never"}
          </dd>
        </div>
      </dl>

      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg text-foreground">Change Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Changing your password signs out every other device.
        </p>
        <ChangePasswordForm requireCurrent submitLabel="Change Password" />
      </div>
    </div>
  );
}
