import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import { isInStock } from "@/lib/products";
import { PriceBlock } from "@/components/shop/PriceBlock";
import type { ProductCardData } from "@/components/shop/ProductCard";

/** Horizontal card for the list view: image left, details right. */
export function ProductListItem({
  product,
}: {
  product: ProductCardData & { description?: string };
}) {
  const inStock = isInStock(product);
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex gap-4 rounded-xl border border-linen/60 bg-white/50 p-3 transition-colors hover:border-bronze/30 sm:gap-6 sm:p-4"
    >
      <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-lg bg-cream sm:w-40">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(min-width: 640px) 160px, 112px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-104"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-graphite/40">
            No image
          </div>
        )}
        {!inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-charcoal/80 px-2 py-0.5 text-[10px] text-ivory">
            Out of stock
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-bronze">
          {CATEGORY_LABELS[product.category]}
        </p>
        <h3 className="mt-1 font-heading text-lg text-charcoal transition-colors duration-300 group-hover:text-bronze">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-graphite/60">
            {product.description}
          </p>
        )}
        <div className="mt-2">
          <PriceBlock price={product.price} mrp={product.mrp} />
        </div>
      </div>
    </Link>
  );
}
