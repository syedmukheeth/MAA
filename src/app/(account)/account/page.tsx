import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatINR } from "@/lib/money";
import { ProfileForm } from "@/components/shop/ProfileForm";

export default async function AccountPage() {
  const session = await requireAuth();
  const [user, orderCount, recentOrders] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.sub } }),
    prisma.order.count({ where: { userId: session.sub } }),
    prisma.order.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Latest shipping address doubles as the saved address until addresses get
  // their own model
  const lastAddress = recentOrders[0];

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

        <div className="space-y-4 rounded-2xl bg-cream p-8 h-fit">
          <h2 className="font-heading text-lg text-charcoal">
            Saved delivery address
          </h2>
          {lastAddress ? (
            <div className="text-sm leading-relaxed text-graphite/80">
              <p className="text-charcoal">
                {lastAddress.shippingName} · {lastAddress.shippingPhone}
              </p>
              <p>
                {lastAddress.shippingLine1}
                {lastAddress.shippingLine2
                  ? `, ${lastAddress.shippingLine2}`
                  : ""}
              </p>
              <p>
                {lastAddress.shippingCity}, {lastAddress.shippingState} -{" "}
                {lastAddress.shippingPincode}
              </p>
              <p className="mt-3 text-xs text-graphite/50">
                From your most recent order. It will be pre-suggested at
                checkout.
              </p>
            </div>
          ) : (
            <p className="text-sm text-graphite/60">
              No address yet — it is saved automatically with your first
              order.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-cream p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-charcoal">Recent orders</h2>
          <Link href="/account/orders" className="text-sm text-bronze">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-graphite/60">
            No orders yet.{" "}
            <Link href="/products" className="text-bronze">
              Browse furniture
            </Link>
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-charcoal">{order.orderNumber}</span>
                <span className="text-graphite/60">
                  {order.createdAt.toLocaleDateString("en-IN")}
                </span>
                <span className="text-graphite/80">
                  {formatINR(order.total.toString())}
                </span>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
