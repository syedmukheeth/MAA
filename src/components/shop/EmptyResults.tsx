import Link from "next/link";
import { SearchX } from "lucide-react";

/** Friendly empty state — the listing must never be silently blank. */
export function EmptyResults({
  query,
  clearHref,
  entity = "products",
}: {
  query?: string;
  clearHref: string;
  entity?: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-cream text-bronze">
        <SearchX size={26} />
      </span>
      <h3 className="mt-5 font-heading text-xl text-charcoal">
        {query
          ? `Sorry, no ${entity} match "${query}"`
          : `No ${entity} found here yet`}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-graphite/60">
        Try a different spelling or a broader word — or browse everything we
        have.
      </p>
      <Link
        href={clearHref}
        className="mt-6 rounded-full border border-bronze px-6 py-2 text-sm text-bronze transition-colors hover:bg-bronze hover:text-ivory"
      >
        Clear search &amp; filters
      </Link>
    </div>
  );
}
