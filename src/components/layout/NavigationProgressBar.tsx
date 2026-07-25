"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Remember the URL the navigation started FROM instead of clearing a boolean
  // in an effect: once the router reports a different URL the navigation has
  // landed, so the bar hides on its own with no effect-driven setState.
  const [navStartedFrom, setNavStartedFrom] = useState<string | null>(null);

  const query = searchParams.toString();
  const currentUrl = query ? `${pathname}?${query}` : pathname;
  const loading = navStartedFrom !== null && navStartedFrom === currentUrl;

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        const targetAttr = anchor.getAttribute("target");
        
        // Ignore external links, hashes, same page, and target="_blank"
        if (
          href &&
          href.startsWith("/") &&
          !href.startsWith("/#") &&
          targetAttr !== "_blank"
        ) {
          const fromUrl = window.location.pathname + window.location.search;
          if (href !== fromUrl) {
            setNavStartedFrom(fromUrl);
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] h-1 w-full overflow-hidden bg-charcoal/20">
      <div className="h-full w-1/3 bg-bronze animate-loading-slide" />
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
