import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { BackLink } from "@/components/admin/BackLink";
import { formatINR } from "@/lib/money";
import { OrderTimelineStepper } from "@/components/shop/OrderTimelineStepper";

import { RefundStatusControl } from "@/components/admin/RefundStatusControl";
import { PaymentVerificationControl } from "@/components/admin/PaymentVerificationControl";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: true, items: true },
  });
  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <BackLink href="/admin/orders" label="Back to Orders" />
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">
          {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div>
        <OrderTimelineStepper
          status={order.status}
          cancelReason={order.cancelReason}
        />
      </div>

      <div className="rounded-xl border border-border p-6">
        <h2 className="font-heading text-lg text-foreground">Shipping & Customer</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {order.shippingName} &middot; {order.shippingPhone}
        </p>
        <p className="text-sm text-muted-foreground">
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""},{" "}
          {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Customer: {order.user.name} ({order.user.email})
        </p>
        <p className="text-sm text-muted-foreground">
          Payment Method: {order.paymentMethod}
        </p>
      </div>

      <div className="rounded-xl border border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg text-foreground">Payment</h2>
          <OrderStatusBadge status={order.paymentState} />
        </div>
        <PaymentVerificationControl
          orderId={order.id}
          paymentMethod={order.paymentMethod}
          paymentState={order.paymentState}
          paymentReference={order.paymentReference}
        />
      </div>

      <div className="rounded-xl border border-border p-6">
        <h2 className="font-heading text-lg text-foreground">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-foreground">
                {item.quantity} x {item.name}
                {item.variantName && (
                  <span className="ml-1 text-muted-foreground">
                    ({item.variantName})
                  </span>
                )}
                {item.optionsSummary && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.optionsSummary}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {formatINR(item.lineTotal.toString())}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-heading text-foreground">
          <span>Total</span>
          <span>{formatINR(order.total.toString())}</span>
        </div>
      </div>

      {(order.status === "CANCELLED" || order.refundStatus !== "NOT_APPLICABLE") && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-heading text-lg text-foreground">
            Refund Management
          </h2>
          <RefundStatusControl
            orderId={order.id}
            refundStatus={order.refundStatus}
            refundAmount={order.refundAmount ? order.refundAmount.toString() : order.total.toString()}
            refundTxnId={order.refundTxnId}
            refundNotes={order.refundNotes}
          />
        </div>
      )}

      <div className="rounded-xl border border-border p-6">
        <h2 className="mb-4 font-heading text-lg text-foreground">
          Update Order Status
        </h2>
        <OrderStatusControl orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
