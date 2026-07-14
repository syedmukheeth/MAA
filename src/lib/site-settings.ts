import { prisma } from "@/lib/db";

export const SETTINGS_ID = "singleton";

export const DEFAULT_SITE_SETTINGS = {
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

  showroomAddress: "MAA Furnitures Showroom, Main Road, Kurnool, Andhra Pradesh",
  showroomHours: "Mon - Sat: 10:00 AM - 8:00 PM · Sun: 11:00 AM - 6:00 PM",
  showroomPhone: "",
  showroomWhatsapp: "",

  instagramUrl: null as string | null,
  facebookUrl: null as string | null,

  deliveryMessage: "Pan-India Delivery Available",
};

export type SiteSettings = typeof DEFAULT_SITE_SETTINGS;

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    if (!row) return DEFAULT_SITE_SETTINGS;
    return {
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
