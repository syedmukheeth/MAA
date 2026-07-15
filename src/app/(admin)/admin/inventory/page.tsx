import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { MovementLog } from "@/components/admin/MovementLog";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  const [variants, movements] = await Promise.all([
    prisma.variant.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: [{ product: { name: "asc" } }, { isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.stockMovement.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        variant: {
          select: { name: true, product: { select: { name: true } } },
        },
      },
    }),
  ]);

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: [
          ...new Set(
            movements.map((m) => m.byUserId).filter((v): v is string => Boolean(v))
          ),
        ],
      },
    },
    select: { id: true, name: true },
  });
  const userNames = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const lowCount = variants.filter(
    (v) => v.stock > 0 && v.stock <= v.lowStockThreshold
  ).length;
  const outCount = variants.filter((v) => v.stock === 0).length;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {variants.length} variants · {lowCount} low stock · {outCount} out
            of stock
          </p>
        </div>
      </div>

      <InventoryTable
        rows={variants.map((v) => ({
          id: v.id,
          productName: v.product.name,
          variantName: v.name,
          isDefault: v.isDefault,
          sku: v.sku,
          woodType: v.woodType,
          finish: v.finish,
          size: v.size,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold,
        }))}
      />

      <h2 className="mt-10 mb-4 font-heading text-lg text-foreground">
        Recent stock movements
      </h2>
      <MovementLog
        movements={movements.map((m) => ({
          id: m.id,
          productName: m.variant.product.name,
          variantName: m.variant.name,
          type: m.type,
          qty: m.qty,
          reason: m.reason,
          orderId: m.orderId,
          byUser: m.byUserId ? (userNames[m.byUserId] ?? "—") : "System",
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
