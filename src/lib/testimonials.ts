import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Whether any testimonial is published.
 *
 * `Testimonials.tsx` renders nothing when the published list is empty, so the
 * footer's "Reviews" link would otherwise point at an anchor that does not
 * exist on the page. Fails soft to `false`: a missing link is better than a
 * link that scrolls nowhere.
 *
 * `cache`d so the three layouts that render <Footer /> share one query per
 * request.
 */
export const hasPublishedTestimonials = cache(async (): Promise<boolean> => {
  try {
    const count = await prisma.testimonial.count({
      where: { isPublished: true },
    });
    return count > 0;
  } catch {
    return false;
  }
});
