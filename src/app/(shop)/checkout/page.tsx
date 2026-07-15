import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { ShippingAddressForm } from "@/components/shop/ShippingAddressForm";

export default async function CheckoutPage() {
  const session = await requireAuth();

  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: {
      items: { include: { product: true, variant: true, combo: true } },
    },
  });

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const unit = item.product
      ? Number(item.product.price) + Number(item.variant?.priceDelta ?? 0)
      : Number(item.combo?.bundlePrice ?? 0);
    return sum + unit * item.quantity;
  }, 0);

  // Pre-fill from the customer's most recent order
  const lastOrder = await prisma.order.findFirst({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  const defaults = lastOrder
    ? {
        shippingName: lastOrder.shippingName,
        shippingPhone: lastOrder.shippingPhone,
        shippingLine1: lastOrder.shippingLine1,
        shippingLine2: lastOrder.shippingLine2 ?? undefined,
        shippingCity: lastOrder.shippingCity,
        shippingState: lastOrder.shippingState,
        shippingPincode: lastOrder.shippingPincode,
      }
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        Checkout
      </h1>
      <div className="mt-10 rounded-2xl bg-cream p-8">
        <ShippingAddressForm subtotal={subtotal} defaults={defaults} />
      </div>
    </div>
  );
}
