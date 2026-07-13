import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export default async function AccountPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({ where: { id: session.sub } });

  return (
    <div>
      <h1 className="font-heading text-3xl text-charcoal">My Profile</h1>
      <div className="mt-8 max-w-md space-y-4 rounded-2xl bg-cream p-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Name
          </p>
          <p className="mt-1 text-charcoal">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Email
          </p>
          <p className="mt-1 text-charcoal">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-graphite/50">
            Member since
          </p>
          <p className="mt-1 text-charcoal">
            {user?.createdAt.toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
