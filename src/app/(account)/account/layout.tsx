import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSiteSettings } from "@/lib/site-settings";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountTabs } from "@/components/layout/AccountTabs";
import { getCartItemCount } from "@/lib/cart";

export default async function AccountLayout({
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
      <Navbar user={user ? { role: user.role } : null} cartItemCount={cartItemCount} />
      <main className="flex-1 pt-20">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-10">
          <AccountTabs />
          {children}
        </div>
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
