import { requireRole } from "@/lib/auth/session";
import {
  getRevenueOverTime,
  getOrderCounts,
  getTopProducts,
  getTopCombos,
  getCustomerGrowth,
  getLowStockProducts,
  getAverageOrderValue,
  getRepeatCustomerRate,
} from "@/lib/analytics";
import { formatINR } from "@/lib/money";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl text-foreground">{value}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const [revenue, orderCounts, topProducts, topCombos, growth, stock, aov, repeat] =
    await Promise.all([
      getRevenueOverTime(),
      getOrderCounts(),
      getTopProducts(),
      getTopCombos(),
      getCustomerGrowth(),
      getLowStockProducts(),
      getAverageOrderValue(),
      getRepeatCustomerRate(),
    ]);

  const totalRevenue = revenue.reduce((sum, r) => sum + r.revenue, 0);
  const totalSignups = growth.reduce((sum, g) => sum + g.signups, 0);

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">
        Insights &middot; Last 30 Days
      </h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatINR(totalRevenue)} />
        <StatCard label="Orders" value={String(orderCounts.total)} />
        <StatCard label="New Customers" value={String(totalSignups)} />
        <StatCard
          label="Out of Stock"
          value={String(stock.outOfStockCount)}
        />
        <StatCard
          label="Avg Order Value"
          value={formatINR(aov.averageOrderValue)}
        />
        <StatCard
          label="Repeat Customer Rate"
          value={`${repeat.repeatRate.toFixed(0)}%`}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg text-foreground">
            Orders by Status
          </h2>
          <div className="mt-4 space-y-2">
            {orderCounts.byStatus.map((s) => (
              <div key={s.status} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{s.status}</span>
                <span className="text-foreground">{s.count}</span>
              </div>
            ))}
            {orderCounts.byStatus.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg text-foreground">
            Revenue by Day
          </h2>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {revenue.map((r) => (
              <div key={r.date} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.date}</span>
                <span className="text-foreground">{formatINR(r.revenue)}</span>
              </div>
            ))}
            {revenue.length === 0 && (
              <p className="text-sm text-muted-foreground">No revenue yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg text-foreground">Top Products</h2>
          <div className="mt-4 space-y-2">
            {topProducts.map((p) => (
              <div key={p.productId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {p.name} &times;{p.quantitySold}
                </span>
                <span className="text-foreground">{formatINR(p.revenue)}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg text-foreground">Top Combos</h2>
          <div className="mt-4 space-y-2">
            {topCombos.map((c) => (
              <div key={c.comboId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {c.name} &times;{c.quantitySold}
                </span>
                <span className="text-foreground">{formatINR(c.revenue)}</span>
              </div>
            ))}
            {topCombos.length === 0 && (
              <p className="text-sm text-muted-foreground">No combo sales yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border p-6 lg:col-span-2">
          <h2 className="font-heading text-lg text-foreground">Low Stock</h2>
          <div className="mt-4 space-y-2">
            {stock.lowStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{p.name}</span>
                <span className="text-amber-500">{p.stockQuantity} left</span>
              </div>
            ))}
            {stock.lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing running low.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
