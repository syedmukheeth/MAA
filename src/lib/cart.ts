import { prisma } from "@/lib/db";
import {
  money,
  sum,
  toPaise,
  taxWithin,
  deliveryFeeFor,
  type Money,
  type MoneyInput,
} from "@/lib/money";

export type CartTotals = {
  subtotal: Money;
  deliveryFee: Money;
  taxRate: Money;
  taxAmount: Money;
  total: Money;
};

type TotalsSettings = {
  gstRate: MoneyInput;
  deliveryFee: MoneyInput;
  freeDeliveryThreshold: MoneyInput | null;
};

/**
 * The single definition of what a basket costs.
 *
 * Cart, checkout, and placeOrder all call this. When each computed its own
 * total, they could silently disagree — the customer reads one number and the
 * order charges another, which is the kind of bug people find on their bank
 * statement rather than on the page.
 *
 * Prices are GST-inclusive, so tax is extracted from the total, not added.
 */
export function computeCartTotals(
  lineTotals: MoneyInput[],
  settings: TotalsSettings
): CartTotals {
  const subtotal = toPaise(sum(lineTotals.map(money)));
  const deliveryFee = deliveryFeeFor(
    subtotal,
    money(settings.deliveryFee),
    settings.freeDeliveryThreshold ? money(settings.freeDeliveryThreshold) : null
  );
  const total = toPaise(subtotal.plus(deliveryFee));
  const taxRate = money(settings.gstRate);
  return {
    subtotal,
    deliveryFee,
    taxRate,
    taxAmount: taxWithin(total, taxRate),
    total,
  };
}

export async function getCartItemCount(userId?: string): Promise<number> {
  if (!userId) return 0;
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  } catch (err) {
    console.error("Error fetching cart item count:", err);
    return 0;
  }
}
