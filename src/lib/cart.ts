import { prisma } from "@/lib/db";

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
