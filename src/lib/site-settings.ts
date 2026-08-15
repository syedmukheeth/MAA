import { cache } from "react";
import { prisma } from "@/lib/db";

export {
  PURCHASES_DISABLED_MESSAGE,
  STAFF_PURCHASE_BLOCKED_MESSAGE,
} from "@/lib/site-settings-constants";

export const SETTINGS_ID = "singleton";

export const DEFAULT_SITE_SETTINGS = {
  // Money is carried as strings, not Decimal: this object crosses the
  // server/client boundary into section components, and Decimal isn't
  // serialisable. Callers doing arithmetic wrap with money() from @/lib/money.
  gstRate: "18",
  deliveryFee: "0",
  freeDeliveryThreshold: null as string | null,

  heroHeadline: "Crafted For Homes.\nBuilt For Generations.",
  heroSubtext:
    "Premium handcrafted furniture designed to bring timeless beauty and lasting comfort into every space.",
  // Empty, not a stock photo. A hero image is the first thing a visitor sees;
  // shipping someone else's living room as the default meant the site looked
  // finished while advertising furniture the shop does not sell. The Hero falls
  // back to a plain background until a real image is uploaded at /admin/settings.
  heroImageUrl: "",

  brandLabel: "Crafted For Better Living",
  brandHeadline:
    "We don't build furniture. We shape the way you live, gather, and grow, one room at a time.",

  // Zero and empty are "not stated yet", and every consumer hides the tile
  // rather than printing a 0. The previous defaults (18 years, 4200 projects,
  // 3600 families, 4.9/5) were invented for the design and would have been
  // published as fact about a real business.
  statYearsExperience: 0,
  statProjectsDelivered: 0,
  statHappyFamilies: 0,
  statGoogleRating: "",

  showroomAddress:
    "Door No 87/1240, MAA FURNITURE, Ramalingam Subhashini Complex, 4th employees colony, near by Shakthi Auto Mobiles, Revenue Colony, Sree Rama Nagar, Kurnool, Kalluru, Andhra Pradesh 518002",
  showroomHours: "Mon - Sat: 10:00 AM - 8:00 PM · Sun: 11:00 AM - 6:00 PM",
  showroomPhone: "8886995345, 9912330151",
  showroomWhatsapp: "8886995345",

  instagramUrl: "https://www.instagram.com/maa.furnitures" as string | null,
  facebookUrl: null as string | null,

  contactEmail: "maafurniture.shop@gmail.com" as string | null,
  mapsUrl: "https://maps.app.goo.gl/S6U6o7R79U3My4m46" as string | null,

  deliveryMessage: "Delivery in Andhra Pradesh Only",

  allowPurchases: true,
  allowCOD: true,
  allowUPI: true,
  upiId: null as string | null,
  upiQrImage: null as string | null,

  // Null = show all categories / use built-in defaults
  shopSections: null as string | null,
  shopCustomSections: null as string | null,
  studioWoods: null as string | null,
  studioFinishes: null as string | null,
  studioBudgets: null as string | null,
  studioFeatures: null as string | null,

  // Null = the owner has not entered any, and the section does not render.
  // There is deliberately no built-in fallback: these blocks make claims
  // (warranty terms, lead times, room photography) that only the business can
  // make truthfully.
  trustBadges: null as string | null,
  faqItems: null as string | null,
  studioImageUrl: null as string | null,
};

export type SiteSettings = typeof DEFAULT_SITE_SETTINGS;

function cleanJson(val: string | null | undefined): string | null {
  if (!val) return null;
  try {
    JSON.parse(val);
    return val;
  } catch {
    console.warn("Corrupted JSON in site settings ignored:", val);
    return null;
  }
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    if (!row) return DEFAULT_SITE_SETTINGS;
    return {
      gstRate: row.gstRate.toString(),
      deliveryFee: row.deliveryFee.toString(),
      freeDeliveryThreshold: row.freeDeliveryThreshold?.toString() ?? null,
      heroHeadline: row.heroHeadline,
      heroSubtext: row.heroSubtext,
      heroImageUrl: row.heroImageUrl,
      brandLabel: row.brandLabel,
      brandHeadline: row.brandHeadline,
      statYearsExperience: row.statYearsExperience,
      statProjectsDelivered: row.statProjectsDelivered,
      statHappyFamilies: row.statHappyFamilies,
      statGoogleRating: row.statGoogleRating,
      showroomAddress: row.showroomAddress,
      showroomHours: row.showroomHours,
      showroomPhone: row.showroomPhone,
      showroomWhatsapp: row.showroomWhatsapp,
      instagramUrl: row.instagramUrl,
      facebookUrl: row.facebookUrl,
      contactEmail: row.contactEmail,
      mapsUrl: row.mapsUrl,
      deliveryMessage: row.deliveryMessage,
      allowPurchases: row.allowPurchases,
      allowCOD: row.allowCOD,
      allowUPI: row.allowUPI,
      upiId: row.upiId,
      upiQrImage: row.upiQrImage,
      shopSections: cleanJson(row.shopSections),
      shopCustomSections: cleanJson(row.shopCustomSections),
      studioWoods: cleanJson(row.studioWoods),
      studioFinishes: cleanJson(row.studioFinishes),
      studioBudgets: cleanJson(row.studioBudgets),
      studioFeatures: cleanJson(row.studioFeatures),
      trustBadges: cleanJson(row.trustBadges),
      faqItems: cleanJson(row.faqItems),
      studioImageUrl: row.studioImageUrl,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
});
