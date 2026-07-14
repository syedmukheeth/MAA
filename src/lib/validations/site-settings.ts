import { z } from "zod";

export const siteSettingsSchema = z.object({
  heroHeadline: z.string().min(2),
  heroSubtext: z.string().min(2),
  heroImageUrl: z.string().min(2),

  brandLabel: z.string().min(2),
  brandHeadline: z.string().min(2),

  statYearsExperience: z.coerce.number().int().min(0),
  statProjectsDelivered: z.coerce.number().int().min(0),
  statHappyFamilies: z.coerce.number().int().min(0),
  statGoogleRating: z.string().min(1),

  showroomAddress: z.string().min(2),
  showroomHours: z.string().min(2),
  showroomPhone: z.string().default(""),
  showroomWhatsapp: z.string().default(""),

  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),

  deliveryMessage: z.string().min(2),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
