/**
 * Shown wherever buying is refused while `allowPurchases` is false. Server
 * actions are callable directly, so hiding the button is not the control —
 * the checks in addToCart and placeOrder are.
 *
 * ponytail: hardcoded copy. Move onto SiteSettings if the owner wants to word
 * it per-season ("back after Diwali") rather than one fixed sentence.
 *
 * Kept in its own file (no `@/lib/db` import) so client components can pull
 * it in without dragging `pg` into the browser bundle.
 */
export const PURCHASES_DISABLED_MESSAGE =
  "Sorry, items are not available for purchase right now.";

/**
 * Staff browse the storefront to check how it looks, not to buy. An owner /
 * admin / manager order would sit in the same queue they administer and skew
 * every sales figure, so buying is CUSTOMER-only. Enforced in addToCart and
 * placeOrder; this string is only what the UI says about it.
 */
export const STAFF_PURCHASE_BLOCKED_MESSAGE =
  "Store accounts cannot place orders. Sign in with a customer account to buy.";
