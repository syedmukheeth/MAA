import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { TestimonialTable } from "@/components/admin/TestimonialTable";

export default async function AdminTestimonialsPage() {
  await requireRole(["OWNER", "ADMIN"]);

  const testimonials = await prisma.testimonial.findMany({
    orderBy: [
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
  });

  const rows = testimonials.map((t) => ({
    id: t.id,
    name: t.name,
    location: t.location,
    quote: t.quote,
    rating: t.rating,
    isPublished: t.isPublished,
    sortOrder: t.sortOrder,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">Customer Testimonials</h1>
        <Link
          href="/admin/testimonials/new"
          className="flex items-center gap-2 rounded-full bg-bronze px-4 py-2 text-sm text-ivory hover:bg-bronze/90"
        >
          <Plus size={16} />
          New Testimonial
        </Link>
      </div>
      <TestimonialTable testimonials={rows} />
    </div>
  );
}
