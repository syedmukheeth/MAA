import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { CartLineItem } from "@/components/shop/CartLineItem";

export default async function CartPage() {
  const session = await requireAuth();

  const cart = await prisma.cart.findUnique({
    where: { userId: session.sub },
    include: {
      items: {
        include: { product: true, combo: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const items = cart?.items ?? [];
  const subtotal = items.reduce((sum, item) => {
    const unit = item.product?.price ?? item.combo?.bundlePrice;
    return sum + Number(unit ?? 0) * item.quantity;
  }, 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        Your Cart
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 text-center text-graphite/60">
          <p>Your cart is empty.</p>
          <Link href="/products" className="mt-4 inline-block text-bronze">
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
                  image:
                    item.product?.images[0] ?? item.combo?.image ?? null,
                  unitPrice: (
                    item.product?.price ?? item.combo?.bundlePrice ?? 0
                  ).toString(),
                  quantity: item.quantity,
                  isCombo: Boolean(item.comboId),
                }}
              />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="font-heading text-xl text-charcoal">
              Subtotal: &#8377;{subtotal.toFixed(2)}
            </p>
            <Link
              href="/checkout"
              className="rounded-full bg-bronze px-8 py-3 text-sm text-ivory hover:bg-bronze/90"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
