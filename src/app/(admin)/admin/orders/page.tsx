import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { OrderTable } from "@/components/admin/OrderTable";

export default async function AdminOrdersPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  const orders = await prisma.order.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.user.name,
    total: o.total.toString(),
    status: o.status,
    createdAt: o.createdAt.toLocaleDateString("en-IN"),
  }));

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">Orders</h1>
      <OrderTable orders={rows} />
    </div>
  );
}
