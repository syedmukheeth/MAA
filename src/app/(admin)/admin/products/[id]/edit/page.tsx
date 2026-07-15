import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ProductForm } from "@/components/admin/ProductForm";
import { BackLink } from "@/components/admin/BackLink";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });
  if (!product) notFound();

  return (
    <div>
      <BackLink href="/admin/products" label="Back to Products" />
      <h1 className="mb-6 font-heading text-2xl text-foreground">
        Edit Product
      </h1>
      <ProductForm
        defaults={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          materials: product.materials.join(", "),
          dimensions: product.dimensions ?? "",
          images: product.images,
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            woodType: v.woodType ?? "",
            finish: v.finish ?? "",
            size: v.size ?? "",
            priceDelta: v.priceDelta.toString(),
            sku: v.sku ?? "",
            stock: String(v.stock),
            lowStockThreshold: String(v.lowStockThreshold),
          })),
          featured: product.featured,
        }}
      />
    </div>
  );
}
