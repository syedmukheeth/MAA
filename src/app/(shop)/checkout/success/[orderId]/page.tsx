import { notFound } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await requireAuth();
  const { orderId } = await params;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.sub) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center lg:px-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-bronze/15 text-bronze">
        <Check size={26} />
      </span>
      <h1 className="mt-6 font-heading text-3xl text-charcoal">
        Order placed
      </h1>
      <p className="mt-2 text-graphite/70">
        Order {order.orderNumber} confirmed. Pay cash on delivery when it
        arrives.
      </p>
      <Link
        href="/account/orders"
        className="mt-8 inline-block rounded-full bg-charcoal px-8 py-3 text-sm text-ivory hover:bg-charcoal/90"
      >
        View Order History
      </Link>
    </div>
  );
}
