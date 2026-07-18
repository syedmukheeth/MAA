import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountOrdersLoading() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-charcoal">Order History</h1>
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-cream p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-charcoal/5" />
              <Skeleton className="h-4 w-24 bg-charcoal/5" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-16 bg-charcoal/5" />
              <Skeleton className="h-6 w-20 rounded-full bg-charcoal/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
