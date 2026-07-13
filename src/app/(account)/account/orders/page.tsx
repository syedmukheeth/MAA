import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

export default async function AccountOrdersPage() {
  const session = await requireAuth();

  const orders = await prisma.order.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-heading text-3xl text-charcoal">Order History</h1>

      {orders.length === 0 ? (
        <p className="mt-8 text-graphite/60">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="flex items-center justify-between rounded-xl bg-cream p-5"
            >
              <div>
                <p className="font-heading text-base text-charcoal">
                  {o.orderNumber}
                </p>
                <p className="text-sm text-graphite/60">
                  {o.createdAt.toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-charcoal">&#8377;{o.total.toString()}</span>
                <OrderStatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
