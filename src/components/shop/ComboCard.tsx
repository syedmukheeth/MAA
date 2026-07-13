import Link from "next/link";
import Image from "next/image";

export type ComboCardData = {
  id: string;
  name: string;
  slug: string;
  bundlePrice: string;
  image: string | null;
  itemNames: string[];
};

export function ComboCard({ combo }: { combo: ComboCardData }) {
  return (
    <Link href={`/combos/${combo.slug}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-cream">
        {combo.image ? (
          <Image
            src={combo.image}
            alt={combo.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-graphite/40">
            No image
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-bronze px-3 py-1 text-xs text-ivory">
          Combo Offer
        </span>
      </div>
      <h3 className="mt-4 font-heading text-lg text-charcoal">{combo.name}</h3>
      <p className="mt-1 text-xs text-graphite/60">{combo.itemNames.join(" + ")}</p>
      <p className="mt-2 text-sm text-charcoal">&#8377;{combo.bundlePrice}</p>
    </Link>
  );
}
