import { ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
      <h1 className="font-heading text-3xl text-charcoal sm:text-4xl">
        All Furniture
      </h1>
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
