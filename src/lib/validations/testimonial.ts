import { z } from "zod";

export const testimonialSchema = z.object({
  name: z.string().min(2, "Customer name is required").max(80),
  /**
   * City only, not an area or a street. This is published next to a named
   * person's photograph, and "Sai Nagar, Kurnool" narrows a stranger down to a
   * few hundred households in a way "Kurnool" does not.
   */
  location: z.string().max(40).optional(),
  quote: z.string().min(10, "Quote is too short").max(600),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  imageUrl: z.string().optional(),
  isPublished: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
  /**
   * The customer account this testimonial is about, when they have one.
   *
   * Optional so a walk-in customer's quote can still be saved, but publication
   * requires either this plus a recorded consent, or the offline attestation
   * below — see the publish guard in actions/testimonials.ts.
   */
  subjectUserId: z.string().optional(),
  /**
   * Staff attestation that the person agreed to publication offline (in the
   * showroom, over WhatsApp). Ticking it writes a real ConsentRecord with
   * source STAFF_RECORDED, so it is a claim someone is accountable for, not a
   * checkbox that bypasses the requirement.
   */
  offlineConsentRecorded: z.coerce.boolean().default(false),
});

export type TestimonialInput = z.input<typeof testimonialSchema>;
