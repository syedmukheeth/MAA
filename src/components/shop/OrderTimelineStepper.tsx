"use client";

import { XCircle, Check } from "lucide-react";

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

      <div className="relative pl-8 space-y-7">
        {STEPS.map((s, index) => {
          // Delivered is a terminal, fully-complete state: when the order IS
          // delivered, show the Delivered step itself as completed (green tick).
          const isCompleted =
            !isCancelled &&
            (index < activeIndex ||
              (status === "DELIVERED" && index === activeIndex));
          const isActive =
            !isCancelled && index === activeIndex && !isCompleted;
          const isLast = index === STEPS.length - 1;

          let dotClass = "bg-white border-linen text-transparent";
          let textColor = "text-graphite/40";
          let labelColor = "text-graphite/50";
          // Connector line colored green once this step is passed.
          const lineClass = isCompleted ? "bg-sage" : "bg-linen";

          if (isCompleted) {
            dotClass = "bg-sage border-sage text-ivory";
            textColor = "text-graphite/60";
            labelColor = "text-charcoal font-medium";
          } else if (isActive) {
            dotClass = "bg-bronze border-bronze text-ivory ring-4 ring-bronze/20";
            textColor = "text-graphite/80";
            labelColor = "text-charcoal font-bold";
          } else if (isCancelled) {
            textColor = "text-graphite/30";
            labelColor = "text-graphite/30";
          }

          return (
            <div key={s.status} className="relative flex gap-4 items-start">
              {/* Connector line to next step */}
              {!isLast && (
                <span
                  className={`absolute left-[-21px] top-6 h-[calc(100%+0.75rem)] w-[2px] ${lineClass}`}
                />
              )}
              {/* Dot with tick when completed / active */}
              <div
                className={`absolute -left-[30px] top-0 flex size-6 items-center justify-center rounded-full border-2 transition-all ${dotClass}`}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : isActive ? (
                  <span className="size-2 rounded-full bg-ivory" />
                ) : null}
              </div>

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
