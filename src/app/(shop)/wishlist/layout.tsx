import { redirect } from "next/navigation";
import { getActiveUser } from "@/lib/auth/session";

/**
 * The wishlist page itself is a client component (the list lives in
 * localStorage), so the staff check has to happen in a server boundary above
 * it. Staff cannot buy, so saving items for later is meaningless for them —
 * same reasoning that hides the cart and wishlist icons in the navbar.
 */
export default async function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getActiveUser();
  if (user && user.role !== "CUSTOMER") {
    redirect("/admin");
  }
  return <>{children}</>;
}
