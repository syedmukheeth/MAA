import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  getSiteSettings,
  PURCHASES_DISABLED_MESSAGE,
  STAFF_PURCHASE_BLOCKED_MESSAGE,
} from "@/lib/site-settings";
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

  const isStaff = user != null && user.role !== "CUSTOMER";
  // Staff carts are never filled, so don't render a count badge for them.
  const cartItemCount = user && !isStaff ? await getCartItemCount(user.sub) : 0;

  const canPurchase = settings.allowPurchases && !isStaff;
  const purchaseBlockedMessage = settings.allowPurchases
    ? isStaff
      ? STAFF_PURCHASE_BLOCKED_MESSAGE
      : null
    : PURCHASES_DISABLED_MESSAGE;

  return (
    <>
      <Navbar user={user ? { role: user.role } : null} cartItemCount={cartItemCount} />
      <main className="flex-1 pt-20">
        <PurchasingProvider
          enabled={canPurchase}
          disabledMessage={purchaseBlockedMessage}
        >
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
