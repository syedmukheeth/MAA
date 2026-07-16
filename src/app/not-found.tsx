import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-bronze">404</p>
      <h1 className="mt-4 font-heading text-3xl text-charcoal">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-sm text-sm text-graphite/70">
        The piece you&apos;re looking for may have moved or sold out. Browse the
        full collection instead.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="rounded-full bg-charcoal px-6 py-2.5 text-sm text-ivory transition-colors hover:bg-charcoal/90"
        >
          Browse furniture
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-2.5 text-sm text-charcoal transition-colors hover:bg-cream"
        >
          Back to homepage
        </Link>
      </div>
    </div>
  );
}
