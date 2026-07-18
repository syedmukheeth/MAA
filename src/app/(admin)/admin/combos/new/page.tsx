import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ComboForm } from "@/components/admin/ComboForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function NewComboPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      variants: {
        select: { id: true, name: true, woodType: true, finish: true, size: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <BackLink href="/admin/combos" label="Back to Combo Offers" />
      <h1 className="mb-6 font-heading text-2xl text-foreground">New Combo</h1>
      <ComboForm products={products} />
    </div>
  );
}
