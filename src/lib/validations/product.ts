import { z } from "zod";

export const ROOM_CATEGORIES = [
  "LIVING_ROOM",
  "BEDROOM",
  "DINING",
  "OFFICE",
  "OUTDOOR",
] as const;

export const CATEGORY_LABELS: Record<(typeof ROOM_CATEGORIES)[number], string> = {
  LIVING_ROOM: "Living Room",
  BEDROOM: "Bedroom",
  DINING: "Dining",
  OFFICE: "Office",
  OUTDOOR: "Outdoor",
};

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().min(10),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category: z.enum(ROOM_CATEGORIES),
  materials: z
    .string()
    .transform((v) =>
      v
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)
    ),
  dimensions: z.string().optional(),
  images: z
    .string()
    .transform((v) =>
      v
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean)
    ),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  featured: z.coerce.boolean().default(false),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductParsed = z.output<typeof productSchema>;
