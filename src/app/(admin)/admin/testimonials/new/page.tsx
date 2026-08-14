import { requireRole } from "@/lib/auth/session";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { listCustomersForPicker } from "@/lib/privacy/customers";

export default async function NewTestimonialPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const customers = await listCustomersForPicker();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">Add Testimonial</h1>
      <TestimonialForm customers={customers} />
    </div>
  );
}
