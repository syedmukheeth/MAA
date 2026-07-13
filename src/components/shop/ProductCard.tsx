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
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
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
      <p className="mt-4 text-xs uppercase tracking-wider text-bronze">
        {CATEGORY_LABELS[product.category]}
      </p>
      <h3 className="mt-1 font-heading text-lg text-charcoal">
        {product.name}
      </h3>
      <p className="mt-1 text-sm text-graphite/70">&#8377;{product.price}</p>
    </Link>
  );
}
