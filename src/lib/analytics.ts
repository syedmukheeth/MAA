import { prisma } from "@/lib/db";

const REVENUE_STATUSES = ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export async function getRevenueOverTime(range?: { from?: Date; to?: Date }) {
  const { from, to } = { ...defaultRange(), ...range };

  const rows = await prisma.$queryRaw<{ day: Date; revenue: string }[]>`
    SELECT DATE("createdAt") as day, SUM("total")::text as revenue
    FROM "Order"
    WHERE "createdAt" BETWEEN ${from} AND ${to}
      AND "status" IN ('CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED')
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;

  return rows.map((r) => ({
    date: new Date(r.day).toISOString().slice(0, 10),
    revenue: Number(r.revenue),
  }));
}

export async function getOrderCounts(range?: { from?: Date; to?: Date }) {
  const { from, to } = { ...defaultRange(), ...range };

  const [total, byStatus] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
  };
}

export async function getTopProducts(range?: {
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const { from, to, limit = 10 } = { ...defaultRange(), ...range };

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "name"],
    where: {
      productId: { not: null },
      order: {
        createdAt: { gte: from, lte: to },
        status: { in: [...REVENUE_STATUSES] },
      },
    },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });

  return grouped.map((g) => ({
    productId: g.productId,
    name: g.name,
    quantitySold: g._sum.quantity ?? 0,
    revenue: Number(g._sum.lineTotal ?? 0),
  }));
}

export async function getTopCombos(range?: {
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const { from, to, limit = 10 } = { ...defaultRange(), ...range };

  const grouped = await prisma.orderItem.groupBy({
    by: ["comboId", "name"],
    where: {
      comboId: { not: null },
      order: {
        createdAt: { gte: from, lte: to },
        status: { in: [...REVENUE_STATUSES] },
      },
    },
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: limit,
  });

  return grouped.map((g) => ({
    comboId: g.comboId,
    name: g.name,
    quantitySold: g._sum.quantity ?? 0,
    revenue: Number(g._sum.lineTotal ?? 0),
  }));
}

export async function getCustomerGrowth(range?: { from?: Date; to?: Date }) {
  const { from, to } = { ...defaultRange(), ...range };

  const rows = await prisma.$queryRaw<{ day: Date; signups: string }[]>`
    SELECT DATE("createdAt") as day, COUNT(*)::text as signups
    FROM "User"
    WHERE "role" = 'CUSTOMER' AND "createdAt" BETWEEN ${from} AND ${to}
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;

  return rows.map((r) => ({
    date: new Date(r.day).toISOString().slice(0, 10),
    signups: Number(r.signups),
  }));
}

export async function getAverageOrderValue(range?: { from?: Date; to?: Date }) {
  const { from, to } = { ...defaultRange(), ...range };

  const result = await prisma.order.aggregate({
    where: {
      createdAt: { gte: from, lte: to },
      status: { in: [...REVENUE_STATUSES] },
    },
    _avg: { total: true },
    _count: { _all: true },
  });

  return {
    averageOrderValue: Number(result._avg.total ?? 0),
    orderCount: result._count._all,
  };
}

export async function getRepeatCustomerRate() {
  const grouped = await prisma.order.groupBy({
    by: ["userId"],
    _count: { _all: true },
  });

  const totalCustomers = grouped.length;
  const repeatCustomers = grouped.filter((g) => g._count._all > 1).length;

  return {
    totalCustomers,
    repeatCustomers,
    repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
  };
}

export async function getLowStockVariants(limit = 10) {
  const [candidates, outOfStockCount] = await Promise.all([
    prisma.variant.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { stock: "asc" },
      take: limit * 3,
      include: { product: { select: { name: true } } },
    }),
    prisma.variant.count({ where: { stock: { lte: 0 } } }),
  ]);
  const lowStock = candidates
    .filter((v) => v.stock <= v.lowStockThreshold)
    .slice(0, limit);
  return { lowStock, outOfStockCount };
}

export async function getLowStockProducts(limit = 20) {
  const [lowStock, outOfStock] = await Promise.all([
    prisma.product.findMany({
      where: { stockQuantity: { gt: 0 }, },
      orderBy: { stockQuantity: "asc" },
      take: limit,
    }).then((rows) => rows.filter((p) => p.stockQuantity <= p.lowStockThreshold)),
    prisma.product.count({ where: { stockQuantity: { lte: 0 } } }),
  ]);

  return { lowStock, outOfStockCount: outOfStock };
}
