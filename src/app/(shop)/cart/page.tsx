import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { CartLineItem } from "@/components/shop/CartLineItem";
import { OrderTotals } from "@/components/shop/OrderTotals";
import { getSiteSettings } from "@/lib/site-settings";
import { computeCartTotals } from "@/lib/cart";
import { money, toPaise } from "@/lib/money";

export default async function CartPage() {
  const session = await requireAuth();

  const [cart, settings] = await Promise.all([
    prisma.cart.findUnique({
      where: { userId: session.sub },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            combo: true,
            comboSelections: {
              include: { variant: true, comboItem: { include: { product: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getSiteSettings(),
  ]);

  const items = cart?.items ?? [];
  const unitPriceOf = (item: (typeof items)[number]) =>
    item.product
      ? toPaise(money(item.product.price).plus(money(item.variant?.priceDelta ?? 0)))
      : toPaise(money(item.combo?.bundlePrice ?? 0));

  const totals = computeCartTotals(
    items.map((item) => toPaise(unitPriceOf(item).times(item.quantity))),
    settings
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">Your Cart</h1>

      {items.length === 0 ? (
        <div className="mt-10 text-center text-graphite/60">
          <p>Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-bronze underline-offset-4 hover:underline"
          >
            Browse furniture
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <div>
            {items.map((item) => (
              <CartLineItem
                key={item.id}
                item={{
                  id: item.id,
                  name: item.product?.name ?? item.combo?.name ?? "Item",
                  slug: item.product?.slug ?? null,
                  comboSlug: item.combo?.slug ?? null,
                  variantLabel:
                    item.variant && !item.variant.isDefault
                      ? item.variant.name
                      : item.comboSelections.length > 0
                        ? item.comboSelections
                            .map(
                              (s) =>
                                `${s.comboItem.product.name}: ${s.variant.name}`
                            )
                            .join("; ")
                        : null,
                  image: item.product?.images[0] ?? item.combo?.image ?? null,
                  unitPrice: unitPriceOf(item).toString(),
                  quantity: item.quantity,
                  isCombo: Boolean(item.comboId),
                }}
              />
            ))}
          </div>

          <div className="mt-10 sm:ml-auto sm:max-w-sm">
            {/* Delivery and tax are shown here, not sprung at the last step. */}
            <OrderTotals
              subtotal={totals.subtotal.toString()}
              deliveryFee={totals.deliveryFee.toString()}
              taxRate={totals.taxRate.toString()}
              taxAmount={totals.taxAmount.toString()}
              total={totals.total.toString()}
            />
            <Link
              href="/checkout"
              className="mt-6 block rounded-full bg-bronze px-8 py-3 text-center text-sm font-medium text-ivory transition-colors hover:bg-bronze/90"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
