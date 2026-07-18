import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { ComboCard } from "@/components/shop/ComboCard";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { EmptyResults } from "@/components/shop/EmptyResults";
import type { Prisma } from "@/generated/prisma/client";

export const revalidate = 300;

export default async function CombosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const query = q?.trim() || undefined;

  const orderBy: Prisma.ComboOrderByWithRelationInput =
    sort === "price_asc"
      ? { bundlePrice: "asc" }
      : sort === "price_desc"
        ? { bundlePrice: "desc" }
        : sort === "name_asc"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const combos = await prisma.combo.findMany({
    where: {
      isActive: true,
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    },
    include: { items: { include: { product: true } } },
    orderBy,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        Combo Offers
      </h1>
      <p className="mt-3 max-w-xl text-graphite/70">
        Curated furniture sets at a bundle price, ready for your room.
      </p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <ShopToolbar scope="combos" listPath="/combos" showViewToggle={false} />
        </Suspense>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {combos.map((c) => (
          <ComboCard
            key={c.id}
            combo={{
              id: c.id,
              name: c.name,
              slug: c.slug,
              bundlePrice: c.bundlePrice.toString(),
              image: c.image,
              itemNames: c.items.map((i) => i.product.name),
            }}
          />
        ))}
        {combos.length === 0 && (
          <EmptyResults query={query} clearHref="/combos" entity="combo offers" />
        )}
      </div>
    </div>
  );
}
