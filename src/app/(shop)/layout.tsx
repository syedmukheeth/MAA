import { Navbar } from "@/components/layout/Navbar";
import { StaffBar } from "@/components/layout/StaffBar";
import { Footer } from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/site-settings";
import { getActiveUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/lib/cart";
import { PurchasingProvider } from "@/components/shop/PurchasingProvider";
import { prisma } from "@/lib/db";
import { getLowStockVariants } from "@/lib/analytics";

/**
 * KNOWN CONSTRAINT — read before trusting `revalidate` in this route group.
 *
 * `getCurrentUser()` reads cookies(), which opts this layout — and therefore
 * EVERY page under (shop) — into dynamic rendering. `next build` confirms it:
 * /products/[slug] renders as ƒ (Dynamic), so the `revalidate = 300` exports on
 * those pages are currently inert.
 *
 * This does NOT affect SEO: dynamic here means SSR-on-demand, and crawlers still
 * receive fully-rendered HTML. What it costs is caching — every product view
 * hits Postgres, which matters against Supabase connection limits under load.
 *
 * Fixing it properly means one of:
 *   1. Next 16 Cache Components (`cacheComponents: true` + "use cache" +
 *      Suspense around the session-dependent Navbar) — the intended model in
 *      this version, but a project-wide migration.
 *   2. Moving the session/cart read into a client component — costs a
 *      logged-out flash in the navbar on first paint.
 *
 * Both are real architectural decisions and neither should be slipped in
 * silently. The `revalidate` exports are left in place because they become
 * live the moment this cookie read moves.
 */

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, user] = await Promise.all([
    getSiteSettings(),
    getActiveUser(),
  ]);

  const isStaff = user != null && user.role !== "CUSTOMER";

  const [cartItemCount, pendingOrdersCount, lowStockData] = await Promise.all([
    user ? getCartItemCount(user.sub) : Promise.resolve(0),
    isStaff ? prisma.order.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    isStaff ? getLowStockVariants(6) : Promise.resolve({ lowStock: [], outOfStockCount: 0 }),
  ]);

  const lowStockCount = isStaff
    ? lowStockData.lowStock.length + lowStockData.outOfStockCount
    : 0;

  return (
    <>
      {isStaff && (
        <StaffBar
          role={user.role}
          email={user.email}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
        />
      )}
      <Navbar user={user ? { role: user.role } : null} cartItemCount={cartItemCount} />
      <main className="flex-1 pt-20">
        <PurchasingProvider enabled={settings.allowPurchases}>
          {children}
        </PurchasingProvider>
      </main>
      <Footer
        instagramUrl={settings.instagramUrl}
        facebookUrl={settings.facebookUrl}
        whatsapp={settings.showroomWhatsapp}
        deliveryMessage={settings.deliveryMessage}
      />
    </>
  );
}
