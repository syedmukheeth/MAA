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
  "Sorry, items are not available for purchase right now. Call 8886995345 to order.";
