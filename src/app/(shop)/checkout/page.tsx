import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { CheckoutWizard } from "@/components/shop/CheckoutWizard";
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

  // Catalogue-only mode: /cart explains why, so send them there rather than
  // rendering a wizard whose final button is guaranteed to fail.
  // Same for staff accounts, which placeOrder refuses outright.
  if (!settings.allowPurchases || session.role !== "CUSTOMER") {
    redirect("/cart");
  }

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

  // The whole list, not just the default one — checkout offers a picker, and
  // previously a user whose addresses were all non-default saw none of them.
  const savedAddresses = await prisma.address.findMany({
    where: { userId: session.sub },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  let defaults = undefined;
  const preselected = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];

  if (preselected) {
    defaults = {
      shippingName: preselected.name,
      shippingPhone: preselected.phone,
      shippingLine1: preselected.line1,
      shippingLine2: preselected.line2 ?? undefined,
      shippingCity: preselected.city,
      shippingState: preselected.state,
      shippingPincode: preselected.pincode,
    };
  } else {
    const lastOrder = await prisma.order.findFirst({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });
    if (lastOrder) {
      defaults = {
        shippingName: lastOrder.shippingName,
        shippingPhone: lastOrder.shippingPhone,
        shippingLine1: lastOrder.shippingLine1,
        shippingLine2: lastOrder.shippingLine2 ?? undefined,
        shippingCity: lastOrder.shippingCity,
        shippingState: lastOrder.shippingState,
        shippingPincode: lastOrder.shippingPincode,
      };
    }
  }

  const savedAddressesData = savedAddresses.map((a) => ({
    id: a.id,
    label: a.label,
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    isDefault: a.isDefault,
  }));

  const totalsData = {
    subtotal: totals.subtotal.toString(),
    deliveryFee: totals.deliveryFee.toString(),
    taxRate: totals.taxRate.toString(),
    taxAmount: totals.taxAmount.toString(),
    total: totals.total.toString(),
  };

  const settingsData = {
    allowCOD: settings.allowCOD,
    allowUPI: settings.allowUPI,
    upiId: settings.upiId,
    upiQrImage: settings.upiQrImage,
  };

  const cartItemsData = cart.items.map((item) => ({
    id: item.id,
    product: item.product
      ? {
          name: item.product.name,
          price: item.product.price.toString(),
          images: item.product.images,
          slug: item.product.slug,
        }
      : null,
    variant: item.variant
      ? {
          name: item.variant.name,
          priceDelta: Number(item.variant.priceDelta),
        }
      : null,
    combo: item.combo
      ? {
          name: item.combo.name,
          bundlePrice: item.combo.bundlePrice.toString(),
          slug: item.combo.slug,
        }
      : null,
    quantity: item.quantity,
  }));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">Checkout</h1>
      <CheckoutWizard
        cartItems={cartItemsData}
        defaults={defaults}
        savedAddresses={savedAddressesData}
        preselectedAddressId={preselected?.id ?? null}
        totals={totalsData}
        settings={settingsData}
      />
    </div>
  );
}
