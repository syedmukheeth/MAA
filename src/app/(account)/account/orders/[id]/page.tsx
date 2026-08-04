import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { CancelOrderButton } from "@/components/shop/CancelOrderButton";
import { BackLink } from "@/components/admin/BackLink";
import { formatINR } from "@/lib/money";
import { OrderTimelineStepper } from "@/components/shop/OrderTimelineStepper";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order || order.userId !== session.sub) notFound();

  return (
    <div className="max-w-2xl">
      <BackLink href="/account/orders" label="Back to Order History" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-charcoal">
          {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-6">
        <OrderTimelineStepper
          status={order.status}
          cancelReason={order.cancelReason}
        />
      </div>

      <div className="rounded-xl bg-cream p-6">
        <h2 className="font-heading text-lg text-charcoal">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-charcoal">
                {item.quantity} x {item.name}
                {item.variantName && (
                  <span className="ml-1 text-graphite/50">
                    ({item.variantName})
                  </span>
                )}
                {item.optionsSummary && (
                  <span className="mt-0.5 block text-xs text-graphite/50">
                    {item.optionsSummary}
                  </span>
                )}
              </span>
              <span className="text-graphite/70">
                {formatINR(item.lineTotal.toString())}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-4 font-heading text-charcoal">
          <span>Total</span>
          <span>{formatINR(order.total.toString())}</span>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-cream p-6 text-sm text-graphite/70">
        <p>{order.shippingName} &middot; {order.shippingPhone}</p>
        <p>
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""},{" "}
          {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
        </p>
        <p className="mt-2">Payment: {order.paymentMethod}</p>
      </div>

      {order.status === "CANCELLED" && order.refundStatus && order.refundStatus !== "NOT_APPLICABLE" && (
        <div className="mt-6 rounded-xl border border-bronze/30 bg-bronze/5 p-6 text-sm">
          <h3 className="font-heading text-base font-semibold text-charcoal">Refund Details</h3>
          <div className="mt-2 space-y-1 text-graphite/80">
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className="font-semibold uppercase tracking-wider text-bronze">
                {order.refundStatus === "PROCESSED"
                  ? "Refund Completed"
                  : order.refundStatus === "FAILED"
                  ? "Refund Issue"
                  : "Refund Processing"}
              </span>
            </p>
            {order.refundAmount && (
              <p>
                <span className="font-medium">Refund Amount:</span>{" "}
                {formatINR(order.refundAmount.toString())}
              </p>
            )}
            {order.refundTxnId && (
              <p>
                <span className="font-medium">Transaction ID / Reference:</span>{" "}
                <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono text-charcoal">
                  {order.refundTxnId}
                </code>
              </p>
            )}
            {order.refundedAt && (
              <p>
                <span className="font-medium">Processed Date:</span>{" "}
                {new Date(order.refundedAt).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </p>
            )}
            {order.refundNotes && (
              <p className="mt-1 text-xs italic text-graphite/60">
                Note: {order.refundNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {order.status === "PENDING" && (
        <div className="mt-6">
          <CancelOrderButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
