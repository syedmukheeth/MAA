import { z } from "zod";

export const siteSettingsSchema = z.object({
  heroHeadline: z.string().min(2),
  heroSubtext: z.string().min(2),
  // Allowed to be empty: there is no built-in hero image any more, and the Hero
  // renders a plain dark section until the owner uploads one.
  heroImageUrl: z.string().default(""),

  brandLabel: z.string().min(2),
  brandHeadline: z.string().min(2),

  statYearsExperience: z.coerce.number().int().min(0),
  statProjectsDelivered: z.coerce.number().int().min(0),
  statHappyFamilies: z.coerce.number().int().min(0),
  // Empty is a valid answer for all four: a shop that has not counted its
  // projects, or has no Google rating yet, should be able to leave them blank
  // rather than publish a number somebody invented. Each tile hides itself.
  statGoogleRating: z.string().default(""),

  showroomAddress: z.string().min(2),
  showroomHours: z.string().min(2),
  showroomPhone: z.string().default(""),
  showroomWhatsapp: z.string().default(""),

  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),

  contactEmail: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Enter a valid email address",
    }),
  mapsUrl: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  studioImageUrl: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),

  deliveryMessage: z.string().min(2),

  allowPurchases: z.coerce.boolean().default(true),
  allowCOD: z.coerce.boolean().default(true),
  allowUPI: z.coerce.boolean().default(true),
  upiId: z.string().optional().nullable().transform((val) => val === "" ? null : val),
  upiQrImage: z.string().optional().nullable().transform((val) => val === "" ? null : val),

  gstRate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100, "GST Rate must be between 0 and 100"),
  deliveryFee: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Delivery fee must be 0 or more"),
  freeDeliveryThreshold: z.string().transform((val) => val === "" ? null : val).nullable().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Threshold must be 0 or more"),

  // Admin-configurable lists (JSON strings)
  shopSections: safeJsonString(),
  shopCustomSections: safeJsonString(),
  studioWoods: safeJsonString(),
  studioFinishes: safeJsonString(),
  studioBudgets: safeJsonString(),
  studioFeatures: safeJsonString(),
  trustBadges: safeJsonString(),
  faqItems: safeJsonString(),
});

function safeJsonString() {
  return z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .refine(
      (val) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Must be a valid JSON array/object string" }
    );
}

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
