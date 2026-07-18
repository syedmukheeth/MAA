import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ComboItemsPicker } from "@/components/shop/ComboItemsPicker";
import { formatINR } from "@/lib/money";
import { getSiteUrl, SITE_NAME } from "@/lib/site-url";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const combo = await prisma.combo.findUnique({
    where: { slug },
    select: { name: true, description: true, image: true, isActive: true },
  });
  if (!combo || !combo.isActive) return { title: "Combo not found" };

  const url = `${getSiteUrl()}/combos/${slug}`;
  const title = `${combo.name} | Furniture Combo`;
  const description = combo.description.slice(0, 155);

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
      images: combo.image ? [{ url: combo.image, alt: combo.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: combo.image ? [combo.image] : [],
    },
  };
}

export default async function ComboDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const combo = await prisma.combo.findUnique({
    where: { slug },
    include: {
      items: {
        include: {
          product: true,
          options: { include: { variant: true } },
        },
      },
    },
  });
  if (!combo || !combo.isActive) notFound();

  const hasInactiveProduct = combo.items.some((i) => !i.product.isActive);
  const outOfStock =
    hasInactiveProduct ||
    combo.items.some((i) => i.product.stockQuantity < i.quantity);

  const variantLabel = (v: {
    name: string;
    woodType: string | null;
    finish: string | null;
    size: string | null;
  }) => {
    const detail = [v.woodType, v.finish, v.size].filter(Boolean).join(" / ");
    return detail || v.name;
  };

  const pickerItems = combo.items.map((i) => ({
    comboItemId: i.id,
    productName: i.product.name,
    image: i.product.images[0] ?? null,
    quantity: i.quantity,
    options: i.options.map((o) => ({
      variantId: o.variantId,
      label: variantLabel(o.variant),
      inStock: o.variant.stock >= i.quantity,
    })),
  }));

  const comboSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: combo.name,
    description: combo.description,
    image: combo.image ? [combo.image] : [],
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: `${getSiteUrl()}/combos/${combo.slug}`,
      priceCurrency: "INR",
      price: combo.bundlePrice.toString(),
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <JsonLd data={comboSchema} />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream">
          {combo.image ? (
            <Image src={combo.image} alt={combo.name} fill className="object-cover" />
          ) : null}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Combo Offer
          </p>
          <h1 className="mt-4 font-heading text-3xl text-charcoal sm:text-4xl">
            {combo.name}
          </h1>
          <p className="mt-4 text-2xl text-charcoal">
            {formatINR(combo.bundlePrice.toString())}
          </p>

          <p className="mt-6 leading-relaxed text-graphite/80">
            {combo.description}
          </p>

          <div className="mt-6">
            <ComboItemsPicker
              comboId={combo.id}
              items={pickerItems}
              disabled={outOfStock}
            />
            {outOfStock && (
              <p className="mt-2 text-sm text-brand-red">
                {hasInactiveProduct
                  ? "This combo is currently unavailable."
                  : "One or more items in this combo are out of stock."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
