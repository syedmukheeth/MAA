import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { CATEGORY_LABELS } from "@/lib/validations/product";
import { isInStock } from "@/lib/products";
import { ProductInspector } from "@/components/shop/ProductInspector";
import { ProductCard } from "@/components/shop/ProductCard";
import { getSiteUrl, SITE_NAME } from "@/lib/site-url";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * ISR, not force-dynamic. Every view previously hit Postgres — with Supabase's
 * connection limits and serverless fan-out, that folds under real traffic, and
 * a product page is the most-linked page on the site. Product mutations call
 * revalidatePath("/products"), so edits still appear promptly.
 */
export const revalidate = 300;

const findProduct = cache((slug: string) => {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      variants: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, images: true, category: true },
  });
  if (!product) return { title: "Product not found" };

  const base = getSiteUrl();
  const url = `${base}/products/${slug}`;
  // The root layout's title describes the brand, not this sofa. A page that
  // can't describe itself can't be shared or ranked.
  const title = `${product.name} | ${CATEGORY_LABELS[product.category]}`;
  const description = product.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_IN",
      // For a furniture business marketing through WhatsApp, the unfurled
      // image IS the ad.
      images: product.images[0] ? [{ url: product.images[0], alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await findProduct(slug);
  // Deactivated products disappear from the storefront entirely.
  if (!product || !product.isActive) notFound();

  const similar = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id }, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const inStock = isInStock(product);
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
    image: v.image,
  }));

  const inspectorProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    mrp: product.mrp ? product.mrp.toString() : null,
    category: product.category,
    materials: product.materials,
    dimensions: product.dimensions,
    images: product.images,
  };

  const base = getSiteUrl();
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.variants.find((v) => v.isDefault)?.sku ?? undefined,
    category: CATEGORY_LABELS[product.category],
    material: product.materials.join(", ") || undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: `${base}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price.toString(),
      // Price and availability are what earn the rich result; omitting either
      // means Google renders a plain link.
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <JsonLd data={productSchema} />
      <ProductInspector product={inspectorProduct} variants={variantOptions} />

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading text-2xl text-charcoal">
            You may also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
            {similar.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: p.price.toString(),
                  mrp: p.mrp?.toString() ?? null,
                  category: p.category,
                  images: p.images,
                  stockQuantity: p.stockQuantity,
                  lowStockThreshold: p.lowStockThreshold,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
