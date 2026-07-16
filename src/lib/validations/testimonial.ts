import { z } from "zod";

export const testimonialSchema = z.object({
  name: z.string().min(2, "Customer name is required").max(80),
  location: z.string().max(80).optional(),
  quote: z.string().min(10, "Quote is too short").max(600),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  imageUrl: z.string().optional(),
  isPublished: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type TestimonialInput = z.input<typeof testimonialSchema>;
