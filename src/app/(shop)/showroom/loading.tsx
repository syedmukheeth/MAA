import { Skeleton } from "@/components/ui/Skeleton";

export default function ShowroomLoading() {
  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-10 text-center lg:px-10">
        <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">
          Our Showroom
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-graphite/70">
          Walk through it before you own it — see the wood, feel the finish,
          and picture it in your home.
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
