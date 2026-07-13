import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ComboForm } from "@/components/admin/ComboForm";

export default async function EditComboPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);
  const { id } = await params;

  const [combo, products] = await Promise.all([
    prisma.combo.findUnique({ where: { id }, include: { items: true } }),
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!combo) notFound();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-foreground">Edit Combo</h1>
      <ComboForm
        products={products}
        defaults={{
          id: combo.id,
          name: combo.name,
          slug: combo.slug,
          description: combo.description,
          bundlePrice: combo.bundlePrice.toString(),
          image: combo.image ?? "",
          isActive: combo.isActive,
          items: combo.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }}
      />
    </div>
  );
}
