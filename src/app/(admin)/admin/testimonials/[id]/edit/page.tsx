import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { listCustomersForPicker } from "@/lib/privacy/customers";
import { hasConsent } from "@/lib/privacy/consent";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;

  const t = await prisma.testimonial.findUnique({
    where: { id },
  });

  if (!t) {
    notFound();
  }

  const [customers, hasSubjectConsent] = await Promise.all([
    listCustomersForPicker(),
    t.subjectUserId
      ? hasConsent(t.subjectUserId, "TESTIMONIAL_PUBLICATION")
      : Promise.resolve(false),
  ]);

  const defaults = {
    id: t.id,
    name: t.name,
    location: t.location ?? "",
    quote: t.quote,
    rating: t.rating,
    imageUrl: t.imageUrl ?? "",
    isPublished: t.isPublished,
    sortOrder: t.sortOrder,
    subjectUserId: t.subjectUserId ?? "",
    hasSubjectConsent,
  };

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">Edit Testimonial</h1>
      <TestimonialForm defaults={defaults} customers={customers} />
    </div>
  );
}
