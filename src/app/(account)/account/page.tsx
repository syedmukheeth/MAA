import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { ProfileForm } from "@/components/shop/ProfileForm";
import { AddressManager } from "@/components/shop/AddressManager";

export default async function AccountPage() {
  const session = await requireAuth();
  const [user, orderCount, addresses] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub } }),
    prisma.order.count({ where: { userId: session.sub } }),
    prisma.address.findMany({
      where: { userId: session.sub },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-heading text-3xl text-charcoal">My Profile</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ProfileForm initialName={user?.name ?? ""} />

          <div className="space-y-4 rounded-2xl bg-cream p-8">
            <h2 className="font-heading text-lg text-charcoal">Account Info</h2>
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
            <div>
              <p className="text-xs uppercase tracking-wider text-graphite/50">
                Total orders
              </p>
              <p className="mt-1 text-charcoal">{orderCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-cream p-8 h-fit">
          <AddressManager addresses={addresses} />
        </div>
      </div>
    </div>
  );
}
