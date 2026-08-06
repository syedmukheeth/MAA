import { ROOM_CATEGORIES } from "@/lib/validations/product";

export type RoomCategory = (typeof ROOM_CATEGORIES)[number];

/**
 * Which room categories the shop currently offers.
 *
 * `SiteSettings.shopSections` is a JSON array of RoomCategory keys, editable in
 * /admin/settings. Null, malformed, or empty-after-filtering all mean "show
 * everything" — an admin typo must not empty the shop.
 *
 * Extracted so the header mega-menu and the /products filter pills cannot
 * disagree about what is on sale.
 */
export function parseEnabledCategories(shopSections: string | null): RoomCategory[] {
  if (!shopSections) return [...ROOM_CATEGORIES];
  try {
    const parsed = JSON.parse(shopSections) as unknown;
    if (!Array.isArray(parsed)) return [...ROOM_CATEGORIES];
    const valid = parsed.filter((k): k is RoomCategory =>
      ROOM_CATEGORIES.includes(k as RoomCategory)
    );
    return valid.length > 0 ? valid : [...ROOM_CATEGORIES];
  } catch {
    return [...ROOM_CATEGORIES];
  }
}
