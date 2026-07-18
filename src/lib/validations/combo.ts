import { z } from "zod";

export const comboItemSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  quantity: z.coerce.number().int().min(1),
  /// Variant ids the customer may pick for this item; empty = fixed item.
  optionVariantIds: z.array(z.string()).default([]),
});

export const comboSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().min(10),
  bundlePrice: z.coerce.number().positive(),
  image: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
  items: z.array(comboItemSchema).min(2, "A combo needs at least 2 products"),
});

export type ComboInput = z.input<typeof comboSchema>;
export type ComboItemInput = z.input<typeof comboItemSchema>;
