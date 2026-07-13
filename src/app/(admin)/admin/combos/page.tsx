import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ComboTable } from "@/components/admin/ComboTable";

export default async function AdminCombosPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  const combos = await prisma.combo.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  const rows = combos.map((c) => ({
    id: c.id,
    name: c.name,
    bundlePrice: c.bundlePrice.toString(),
    isActive: c.isActive,
    itemCount: c._count.items,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">Combo Offers</h1>
        <Link
          href="/admin/combos/new"
          className="flex items-center gap-2 rounded-full bg-bronze px-4 py-2 text-sm text-ivory hover:bg-bronze/90"
        >
          <Plus size={16} />
          New Combo
        </Link>
      </div>
      <ComboTable combos={rows} />
    </div>
  );
}
