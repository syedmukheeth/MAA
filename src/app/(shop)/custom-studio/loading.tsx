import { Skeleton } from "@/components/ui/Skeleton";

export default function CustomStudioLoading() {
  return (
    <div className="-mt-header">
      <div className="bg-gradient-to-b from-charcoal to-espresso pt-header">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 text-center lg:px-10">
          <h1 className="font-heading text-4xl text-ivory sm:text-5xl">
            Custom Studio
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ivory/70">
            Furniture built to your exact space, taste, and budget. One chair or
            a full home.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10 space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
