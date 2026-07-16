import { prisma } from "@/lib/db";
import { ComboCard } from "@/components/shop/ComboCard";

export const revalidate = 300;

export default async function CombosPage() {
  const combos = await prisma.combo.findMany({
    where: { isActive: true },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        Combo Offers
      </h1>
      <p className="mt-3 max-w-xl text-graphite/70">
        Curated furniture sets at a bundle price, ready for your room.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className="col-span-full text-center text-graphite/60">
            No combo offers available right now.
          </p>
        )}
      </div>
    </div>
  );
}
