import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ComboForm } from "@/components/admin/ComboForm";

export default async function NewComboPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  const products = await prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">New Combo</h1>
      <ComboForm products={products} />
    </div>
  );
}
