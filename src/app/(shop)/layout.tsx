import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/site-settings";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/lib/cart";
import { PurchasingProvider } from "@/components/shop/PurchasingProvider";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { parseEnabledCategories } from "@/lib/shop-sections";

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
    getCurrentUser(),
  ]);

  const cartItemCount = user ? await getCartItemCount(user.sub) : 0;

  return (
    <>
      <Navbar
        user={user ? { role: user.role } : null}
        cartItemCount={cartItemCount}
        categories={parseEnabledCategories(settings.shopSections)}
        featuredImageUrl={settings.heroImageUrl}
        phone={settings.showroomPhone}
        whatsapp={settings.showroomWhatsapp}
        instagramUrl={settings.instagramUrl}
        facebookUrl={settings.facebookUrl}
      />
      {/* pt-header clears the fixed navbar. The mobile tab bar's height is
          reserved by the footer itself, since the footer is what it would
          otherwise cover. */}
      <main className="flex-1 pt-header">
        <PurchasingProvider enabled={settings.allowPurchases}>
          {children}
        </PurchasingProvider>
      </main>
      <Footer
        instagramUrl={settings.instagramUrl}
        facebookUrl={settings.facebookUrl}
        whatsapp={settings.showroomWhatsapp}
        phone={settings.showroomPhone}
        address={settings.showroomAddress}
        hours={settings.showroomHours}
        deliveryMessage={settings.deliveryMessage}
      />
      <MobileTabBar cartItemCount={cartItemCount} />
      <WhatsAppFab whatsapp={settings.showroomWhatsapp} />
    </>
  );
}
