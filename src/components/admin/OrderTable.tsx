import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

export type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: string;
  status: string;
  createdAt: string;
};

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="text-foreground hover:text-bronze"
                >
                  {o.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {o.customerName}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                &#8377;{o.total}
              </td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={o.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {o.createdAt}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
