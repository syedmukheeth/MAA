"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next sanitizes server error messages in production; the digest is the
    // only handle that ties this screen to the server log.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-bronze">Something broke</p>
      <h1 className="mt-4 font-heading text-3xl text-charcoal">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-3 max-w-sm text-sm text-graphite/70">
        This is on us, not you. Try again — if it keeps happening, please let us
        know and we&apos;ll sort it out.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-charcoal px-6 py-2.5 text-sm text-ivory transition-colors hover:bg-charcoal/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-2.5 text-sm text-charcoal transition-colors hover:bg-cream"
        >
          Back to homepage
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-xs text-graphite/40">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
