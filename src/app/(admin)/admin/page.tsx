import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrderCounts } from "@/lib/analytics";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const orderCounts = await getOrderCounts();

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
