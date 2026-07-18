import { prisma } from "@/lib/db";

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
  heroImageUrl:
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=2400&auto=format&fit=crop",

  brandLabel: "Crafted For Better Living",
  brandHeadline:
    "We don't build furniture. We shape the way you live, gather, and grow, one room at a time.",

  statYearsExperience: 18,
  statProjectsDelivered: 4200,
  statHappyFamilies: 3600,
  statGoogleRating: "4.9/5",

  showroomAddress:
    "Door No 87/1240, MAA FURNITURE, Ramalingam Subhashini Complex, 4th employees colony, near by Shakthi Auto Mobiles, Revenue Colony, Sree Rama Nagar, Kurnool, Kalluru, Andhra Pradesh 518002",
  showroomHours: "Mon - Sat: 10:00 AM - 8:00 PM · Sun: 11:00 AM - 6:00 PM",
  showroomPhone: "8886995345, 9912330151",
  showroomWhatsapp: "8886995345",

  instagramUrl: "https://www.instagram.com/maa.furnitures" as string | null,
  facebookUrl: null as string | null,

  deliveryMessage: "Delivery in Andhra Pradesh Only",
};

export type SiteSettings = typeof DEFAULT_SITE_SETTINGS;

export async function getSiteSettings(): Promise<SiteSettings> {
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
      deliveryMessage: row.deliveryMessage,
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
