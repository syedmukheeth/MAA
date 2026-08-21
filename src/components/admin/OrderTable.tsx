import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatINR } from "@/lib/format";

export type OrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: string;
  status: string;
  /** PaymentState — staff need to spot "money not in yet" without opening the order. */
  paymentState: string;
  createdAt: string;
};

/**
 * Every cell is its own link to the order rather than one link in the Order
 * column, so the whole row is a click target at any horizontal position.
 *
 * A single stretched link (`::after` over a `position: relative` row) would be
 * one tab stop instead of five, but `position` on `<tr>` is the one place table
 * layout still disagrees across browsers. Real anchors in each cell always
 * work — and `tabIndex={-1}` on all but the first keeps the row a single stop
 * for the keyboard while leaving each cell's text where a screen reader
 * expects it.
 */
function RowLink({
  orderId,
  primary = false,
  className = "",
  children,
}: {
  orderId: string;
  primary?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/admin/orders/${orderId}`}
      tabIndex={primary ? undefined : -1}
      className={`block px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bronze ${className}`}
    >
      {children}
    </Link>
  );
}

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
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => (
            <tr
              key={o.id}
              className="group cursor-pointer transition-colors hover:bg-bronze/5"
            >
              {/* p-0 on the cells: the padding moves onto the anchors so the
                  clickable area is the cell, not just the text inside it. */}
              <td className="p-0">
                <RowLink
                  orderId={o.id}
                  primary
                  className="text-foreground group-hover:text-bronze"
                >
                  {o.orderNumber}
                </RowLink>
              </td>
              <td className="p-0">
                <RowLink orderId={o.id} className="text-muted-foreground">
                  {o.customerName}
                </RowLink>
              </td>
              <td className="p-0">
                <RowLink orderId={o.id} className="text-muted-foreground">
                  {formatINR(o.total)}
                </RowLink>
              </td>
              <td className="p-0">
                <RowLink orderId={o.id}>
                  <OrderStatusBadge status={o.status} />
                </RowLink>
              </td>
              <td className="p-0">
                <RowLink orderId={o.id}>
                  <OrderStatusBadge status={o.paymentState} />
                </RowLink>
              </td>
              <td className="p-0">
                <RowLink orderId={o.id} className="text-muted-foreground">
                  {o.createdAt}
                </RowLink>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No orders yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
