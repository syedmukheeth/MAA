import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import { isInStock, isLowStock } from "@/lib/products";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { VariantPicker } from "@/components/shop/VariantPicker";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });
  if (!product) notFound();

  const inStock = isInStock(product);
  const lowStock = isLowStock(product);
  const hasVariantChoices =
    product.variants.length > 1 ||
    (product.variants.length === 1 && !product.variants[0].isDefault);
  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    woodType: v.woodType,
    finish: v.finish,
    size: v.size,
    priceDelta: Number(v.priceDelta),
    stock: v.stock,
    lowStockThreshold: v.lowStockThreshold,
    isDefault: v.isDefault,
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : null}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1).map((img) => (
                <div
                  key={img}
                  className="relative aspect-square overflow-hidden rounded-lg bg-cream"
                >
                  <Image src={img} alt={product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            {CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="mt-4 font-heading text-3xl text-charcoal sm:text-4xl">
            {product.name}
          </h1>
          {hasVariantChoices ? (
            <div className="mt-4">
              <VariantPicker
                productId={product.id}
                basePrice={Number(product.price)}
                variants={variantOptions}
              />
            </div>
          ) : (
            <>
              <p className="mt-4 text-2xl text-charcoal">
                &#8377;{product.price.toString()}
              </p>

              <p className="mt-2 text-sm">
                {!inStock ? (
                  <span className="text-brand-red">Out of stock</span>
                ) : lowStock ? (
                  <span className="text-amber-600">
                    Only {product.stockQuantity} left
                  </span>
                ) : (
                  <span className="text-graphite/60">In stock</span>
                )}
              </p>
            </>
          )}

          <p className="mt-6 leading-relaxed text-graphite/80">
            {product.description}
          </p>

          {product.materials.length > 0 && (
            <p className="mt-4 text-sm text-graphite/60">
              <span className="text-charcoal">Materials:</span>{" "}
              {product.materials.join(", ")}
            </p>
          )}
          {product.dimensions && (
            <p className="mt-1 text-sm text-graphite/60">
              <span className="text-charcoal">Dimensions:</span>{" "}
              {product.dimensions}
            </p>
          )}

          {!hasVariantChoices && (
            <div className="mt-8">
              <AddToCartButton productId={product.id} disabled={!inStock} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
