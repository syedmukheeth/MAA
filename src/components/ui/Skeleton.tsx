import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-charcoal/10", className)}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="aspect-[4/5] w-full rounded-xl bg-charcoal/5 animate-pulse" />
      <div className="h-3 w-1/4 rounded bg-charcoal/10 animate-pulse" />
      <div className="h-5 w-3/4 rounded bg-charcoal/10 animate-pulse" />
      <div className="h-4 w-1/3 rounded bg-charcoal/10 animate-pulse" />
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      {/* Left: Gallery Skeleton */}
      <div className="space-y-4">
        <div className="aspect-square w-full rounded-2xl bg-charcoal/5 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-charcoal/5 animate-pulse" />
          ))}
        </div>
      </div>
      {/* Right: Details Skeleton */}
      <div className="space-y-6">
        <div className="h-4 w-1/4 rounded bg-charcoal/10 animate-pulse" />
        <div className="h-10 w-3/4 rounded bg-charcoal/10 animate-pulse" />
        <div className="h-6 w-1/3 rounded bg-charcoal/10 animate-pulse" />
        <div className="space-y-2 pt-4">
          <div className="h-4 w-full rounded bg-charcoal/5 animate-pulse" />
          <div className="h-4 w-full rounded bg-charcoal/5 animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-charcoal/5 animate-pulse" />
        </div>
        <div className="h-12 w-full rounded-full bg-charcoal/10 animate-pulse pt-4" />
      </div>
    </div>
  );
}

export function ComboCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="aspect-[16/10] w-full rounded-xl bg-charcoal/5 animate-pulse" />
      <div className="h-5 w-3/4 rounded bg-charcoal/10 animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-charcoal/10 animate-pulse" />
      <div className="h-4 w-1/4 rounded bg-charcoal/10 animate-pulse" />
    </div>
  );
}

export function ComboGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <ComboCardSkeleton key={i} />
      ))}
    </div>
  );
}
