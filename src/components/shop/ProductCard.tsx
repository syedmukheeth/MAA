import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import { isInStock } from "@/lib/products";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: string;
  category: keyof typeof CATEGORY_LABELS;
  images: string[];
  stockQuantity: number;
  lowStockThreshold: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const inStock = isInStock(product);
  const image = product.images[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream border border-linen/60 transition-colors duration-300 group-hover:border-bronze/30">
        {image ? (
          <>
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-104"
            />
            {product.images[1] && (
              <Image
                src={product.images[1]}
                alt={product.name}
                fill
                className="object-cover absolute inset-0 opacity-0 transition-opacity duration-700 ease-in-out group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-graphite/40">
            No image
          </div>
        )}
        {!inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-charcoal/80 px-3 py-1 text-xs text-ivory">
            Out of stock
          </span>
        )}
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-semibold text-bronze">
        {CATEGORY_LABELS[product.category]}
      </p>
      <h3 className="mt-1 font-heading text-base text-charcoal group-hover:text-bronze transition-colors duration-300">
        {product.name}
      </h3>
      <p className="mt-1 text-sm font-medium text-graphite/80">&#8377;{product.price}</p>
    </Link>
  );
}
