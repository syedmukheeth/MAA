import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/site-settings";
import { getActiveUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/lib/cart";
import { PurchasingProvider } from "@/components/shop/PurchasingProvider";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { parseEnabledCategories } from "@/lib/shop-sections";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, user] = await Promise.all([
    getSiteSettings(),
    getActiveUser(),
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
