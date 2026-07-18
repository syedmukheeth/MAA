import { ProductDetailSkeleton } from "@/components/ui/Skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
      <ProductDetailSkeleton />
    </div>
  );
}
