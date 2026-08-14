import { prisma } from "@/lib/db";
import type { CustomerOption } from "@/components/admin/TestimonialForm";

/**
 * The customer picker used by the testimonial consent block.
 *
 * Selects three columns and nothing else. The obvious version of this query is
 * a bare findMany, which would ship every column of every customer — including
 * passwordHash — into an admin page's RSC payload; that exact bug existed on
 * /admin/users. Erased accounts are excluded because a tombstone is not a
 * person you can obtain consent from.
 */
export async function listCustomersForPicker(): Promise<CustomerOption[]> {
  return prisma.user.findMany({
    where: { role: "CUSTOMER", isActive: true, erasedAt: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 500,
  });
}
