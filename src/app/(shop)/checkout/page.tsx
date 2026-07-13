import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { ShippingAddressForm } from "@/components/shop/ShippingAddressForm";

export default async function CheckoutPage() {
  const session = await requireAuth();

  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: { items: { include: { product: true, combo: true } } },
  });

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const unit = item.product?.price ?? item.combo?.bundlePrice;
    return sum + Number(unit ?? 0) * item.quantity;
  }, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        Checkout
      </h1>
      <div className="mt-10 rounded-2xl bg-cream p-8">
        <ShippingAddressForm subtotal={subtotal} />
      </div>
    </div>
  );
}
