import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

export const dynamic = "force-dynamic";

export default async function ComboDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const combo = await prisma.combo.findUnique({
    where: { slug },
    include: { items: { include: { product: true } } },
  });
  if (!combo || !combo.isActive) notFound();

  const outOfStock = combo.items.some(
    (i) => i.product.stockQuantity < i.quantity
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
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
            &#8377;{combo.bundlePrice.toString()}
          </p>

          <p className="mt-6 leading-relaxed text-graphite/80">
            {combo.description}
          </p>

          <div className="mt-6 space-y-2">
            <p className="text-sm text-charcoal">Includes:</p>
            <ul className="space-y-1 text-sm text-graphite/70">
              {combo.items.map((i) => (
                <li key={i.id}>
                  {i.quantity} x {i.product.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <AddToCartButton comboId={combo.id} disabled={outOfStock} />
            {outOfStock && (
              <p className="mt-2 text-sm text-brand-red">
                One or more items in this combo are out of stock.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
