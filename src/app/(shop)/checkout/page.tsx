import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { ShippingAddressForm } from "@/components/shop/ShippingAddressForm";
import { OrderTotals } from "@/components/shop/OrderTotals";
import { getSiteSettings } from "@/lib/site-settings";
import { computeCartTotals } from "@/lib/cart";
import { money, toPaise } from "@/lib/money";

export default async function CheckoutPage() {
  const session = await requireAuth();

  const [cart, settings] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: session.sub },
      include: {
        items: { include: { product: true, variant: true, combo: true } },
      },
    }),
    getSiteSettings(),
  ]);

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const totals = computeCartTotals(
    cart.items.map((item) => {
      const unit = item.product
        ? money(item.product.price).plus(money(item.variant?.priceDelta ?? 0))
        : money(item.combo?.bundlePrice ?? 0);
      return toPaise(unit.times(item.quantity));
    }),
    settings
  );

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
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">Checkout</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="rounded-2xl bg-cream p-8">
          <ShippingAddressForm total={totals.total.toString()} defaults={defaults} />
        </div>
        <div className="lg:w-72">
          <OrderTotals
            subtotal={totals.subtotal.toString()}
            deliveryFee={totals.deliveryFee.toString()}
            taxRate={totals.taxRate.toString()}
            taxAmount={totals.taxAmount.toString()}
            total={totals.total.toString()}
          />
          <p className="mt-4 px-1 text-xs text-graphite/60">
            Cash on delivery. Pay when your furniture arrives.
          </p>
        </div>
      </div>
    </div>
  );
}
