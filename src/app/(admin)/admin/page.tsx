import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrderCounts, getLowStockVariants } from "@/lib/analytics";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const [orderCounts, lowStockData] = await Promise.all([
    getOrderCounts(),
    getLowStockVariants(6),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl text-foreground">
        Welcome back{user ? `, ${user.email}` : ""}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use the sidebar to manage products, combo offers, orders, and custom
        furniture requests.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Orders (30d)
          </p>
          <p className="mt-2 font-heading text-2xl text-foreground">
            {orderCounts.total}
          </p>
        </div>
        {orderCounts.byStatus.map((s) => (
          <div key={s.status} className="rounded-xl border border-border p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {s.status}
            </p>
            <p className="mt-2 font-heading text-2xl text-foreground">
              {s.count}
            </p>
          </div>
        ))}
      </div>

      {(lowStockData.lowStock.length > 0 ||
        lowStockData.outOfStockCount > 0) && (
        <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-amber-500">
              Stock alerts
            </p>
            <Link
              href="/admin/inventory"
              className="text-xs text-amber-500 hover:underline"
            >
              Open inventory →
            </Link>
          </div>
          {lowStockData.outOfStockCount > 0 && (
            <p className="mt-2 text-sm text-destructive">
              {lowStockData.outOfStockCount} variant
              {lowStockData.outOfStockCount === 1 ? "" : "s"} out of stock
            </p>
          )}
          {lowStockData.lowStock.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {lowStockData.lowStock.map((v) => (
                <li key={v.id} className="flex justify-between">
                  <span>
                    {v.product.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {v.name}
                    </span>
                  </span>
                  <span className="text-amber-500">{v.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(user?.role === "OWNER" || user?.role === "ADMIN") && (
        <Link
          href="/admin/analytics"
          className="mt-8 inline-block rounded-full bg-bronze px-6 py-2.5 text-sm text-ivory hover:bg-bronze/90"
        >
          View full insights
        </Link>
      )}
    </div>
  );
}
