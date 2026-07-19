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

  allowCOD: z.coerce.boolean().default(true),
  allowUPI: z.coerce.boolean().default(true),
  upiId: z.string().optional().nullable().transform((val) => val === "" ? null : val),
  upiQrImage: z.string().optional().nullable().transform((val) => val === "" ? null : val),

  gstRate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, "GST Rate must be between 0 and 100"),
  deliveryFee: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Delivery fee must be 0 or more"),
  freeDeliveryThreshold: z.string().transform((val) => val === "" ? null : val).nullable().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Threshold must be 0 or more"),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
