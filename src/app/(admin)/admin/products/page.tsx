import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ProductTable } from "@/components/admin/ProductTable";

export default async function AdminProductsPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price.toString(),
    category: p.category,
    stockQuantity: p.stockQuantity,
    lowStockThreshold: p.lowStockThreshold,
    featured: p.featured,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-foreground">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-full bg-bronze px-4 py-2 text-sm text-ivory hover:bg-bronze/90"
        >
          <Plus size={16} />
          New Product
        </Link>
      </div>
      <ProductTable products={rows} />
    </div>
  );
}
