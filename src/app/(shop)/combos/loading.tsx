import { ComboGridSkeleton } from "@/components/ui/Skeleton";

export default function CombosLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        Combo Offers
      </h1>
      <p className="mt-3 max-w-xl text-graphite/70">
        Curated furniture sets at a bundle price, ready for your room.
      </p>
      <div className="mt-8">
        <ComboGridSkeleton />
      </div>
    </div>
  );
}
