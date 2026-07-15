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

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Variant name is required").max(80),
  woodType: z.string().max(60).optional(),
  finish: z.string().max(60).optional(),
  size: z.string().max(60).optional(),
  priceDelta: z.coerce.number().default(0),
  sku: z.string().max(60).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(3),
});

export type VariantInput = z.input<typeof variantSchema>;

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
  images: z.array(z.string()).min(1, "Upload at least one image"),
  variants: z.array(variantSchema).min(1, "Add at least one variant"),
  featured: z.coerce.boolean().default(false),
});

export type ProductInput = z.input<typeof productSchema>;
export type ProductParsed = z.output<typeof productSchema>;
