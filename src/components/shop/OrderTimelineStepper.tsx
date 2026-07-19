"use client";

import { XCircle } from "lucide-react";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const STEPS = [
  { status: "PENDING", label: "Order Placed", desc: "We have received your order." },
  { status: "CONFIRMED", label: "Confirmed", desc: "The order is confirmed by the shop." },
  { status: "PACKED", label: "Packed", desc: "Your items have been packed." },
  { status: "SHIPPED", label: "Shipped", desc: "Out for delivery / shipped." },
  { status: "DELIVERED", label: "Delivered", desc: "Delivered to your address." },
];

export function OrderTimelineStepper({
  status,
  cancelReason,
}: {
  status: OrderStatus;
  cancelReason?: string | null;
}) {
  const isCancelled = status === "CANCELLED";
  
  // Find index of the status in the non-cancelled timeline
  const activeIndex = STEPS.findIndex((s) => s.status === status);
  
  return (
    <div className="rounded-2xl border border-linen bg-white p-6 space-y-6">
      <h3 className="font-heading text-lg text-charcoal">Order Status</h3>
      
      {isCancelled && (
        <div className="rounded-xl bg-brand-red/5 border border-brand-red/10 p-4 flex gap-3 text-sm text-brand-red">
          <XCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold">This order was cancelled</p>
            {cancelReason && (
              <p className="mt-1 opacity-90 text-xs">Reason: {cancelReason}</p>
            )}
          </div>
        </div>
      )}

      <div className="relative pl-6 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[2px] before:bg-linen">
        {STEPS.map((s, index) => {
          const isCompleted = !isCancelled && index < activeIndex;
          const isActive = !isCancelled && index === activeIndex;

          let dotClass = "bg-linen ring-linen/10";
          let textColor = "text-graphite/40";
          let labelColor = "text-graphite/50";

          if (isCompleted) {
            dotClass = "bg-sage ring-sage/20";
            textColor = "text-graphite/60";
            labelColor = "text-charcoal font-medium";
          } else if (isActive) {
            dotClass = "bg-bronze ring-bronze/30 scale-125";
            textColor = "text-graphite/80";
            labelColor = "text-charcoal font-bold";
          } else if (isCancelled) {
            textColor = "text-graphite/30";
            labelColor = "text-graphite/30";
          }

          return (
            <div key={s.status} className="relative flex gap-4 items-start">
              {/* Dot */}
              <div
                className={`absolute -left-[25px] flex size-3 items-center justify-center rounded-full border-2 border-white ring-4 ${dotClass}`}
              />

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${labelColor}`}>{s.label}</p>
                <p className={`text-xs mt-0.5 ${textColor}`}>{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
