import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/site-settings";
import { getActiveUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/lib/cart";
import { PurchasingProvider } from "@/components/shop/PurchasingProvider";

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
