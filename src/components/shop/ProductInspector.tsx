"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductGallery } from "./ProductGallery";
import { VariantPicker, type VariantOption } from "./VariantPicker";
import { PriceBlock } from "./PriceBlock";
import { AddToCartButton } from "./AddToCartButton";
import { CATEGORY_LABELS } from "@/lib/validations/product";

export type InspectorProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  mrp: string | null;
  category: "LIVING_ROOM" | "BEDROOM" | "DINING" | "OFFICE" | "OUTDOOR";
  materials: string[];
  dimensions: string | null;
  images: string[];
};

export function ProductInspector({
  product,
  variants,
}: {
  product: InspectorProduct;
  variants: VariantOption[];
}) {
  const router = useRouter();
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants.find((v) => v.isDefault && v.stock > 0)?.id ??
      variants.find((v) => v.stock > 0)?.id ??
      variants[0]?.id
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  const price = Number(product.price) + (selectedVariant?.priceDelta ?? 0);
  const mrp = product.mrp ? Number(product.mrp) + (selectedVariant?.priceDelta ?? 0) : null;
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const lowStock = inStock && (selectedVariant?.stock ?? 0) <= (selectedVariant?.lowStockThreshold ?? 0);

  const hasVariantChoices =
    variants.length > 1 || (variants.length === 1 && !variants[0].isDefault);

  // When variants exist with images, use the first variant image as the primary.
  // This avoids showing a generic "common image" when per-variant images are available.
  const buildGalleryImages = () => {
    if (hasVariantChoices) {
      // If selected variant has its own image, lead with it
      if (selectedVariant?.image) {
        return [selectedVariant.image, ...product.images.filter((img) => img !== selectedVariant.image)];
      }
      // If ALL variants have images, use the first variant's image as primary
      const firstVariantImage = variants[0]?.image;
      if (firstVariantImage) {
        return [firstVariantImage, ...product.images.filter((img) => img !== firstVariantImage)];
      }
    }
    return product.images;
  };

  const galleryImages = buildGalleryImages();

  return (
    <div>
      {/* Back navigation arrow */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-graphite/60 hover:text-bronze transition-colors group"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to Shop
      </button>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Keying the gallery by active variant image ensures it resets/swaps cleanly when variant changes */}
        <ProductGallery key={selectedVariant?.image || "default"} images={galleryImages} alt={product.name} />

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
                mrp={product.mrp ? Number(product.mrp) : null}
                variants={variants}
                selectedId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            </div>
          ) : (
            <>
              <div className="mt-4">
                <PriceBlock
                  price={price.toString()}
                  mrp={mrp?.toString()}
                  size="lg"
                />
              </div>

              <p className="mt-2 text-sm">
                {!inStock ? (
                  <span className="text-brand-red bg-brand-red/10 px-2.5 py-1 rounded-full">Out of stock</span>
                ) : lowStock ? (
                  <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    Only {selectedVariant.stock} left
                  </span>
                ) : (
                  <span className="text-sage bg-sage/10 px-2.5 py-1 rounded-full">In stock</span>
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
              <AddToCartButton productId={product.id} variantId={selectedVariant?.id} disabled={!inStock} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
