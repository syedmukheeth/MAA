"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { PriceBlock } from "@/components/shop/PriceBlock";

type Suggestion = {
  id: string;
  name: string;
  href: string;
  price: string;
  mrp: string | null;
  image: string | null;
};

/**
 * Live search with a forgiving contains match — suggestions appear as the
 * customer types (debounced), Enter applies the query to the listing page.
 */
export function SearchBar({
  scope = "products",
  listPath = "/products",
  initialQuery = "",
  placeholder = "Search furniture...",
}: {
  scope?: "products" | "combos";
  listPath?: string;
  initialQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&scope=${scope}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results);
        setHighlighted(-1);
      } catch {
        // aborted or offline — keep previous suggestions
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value, scope]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function applyQuery(q: string) {
    setOpen(false);
    const params = new URLSearchParams(window.location.search);
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    params.delete("page");
    router.push(`${listPath}${params.toString() ? `?${params}` : ""}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && suggestions[highlighted]) {
        setOpen(false);
        router.push(suggestions[highlighted].href);
      } else {
        applyQuery(value);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && value.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite/40"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-10 w-full rounded-full border border-border bg-white/70 pl-10 pr-9 text-sm text-charcoal outline-none transition-colors placeholder:text-graphite/40 focus:border-bronze"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              setSuggestions([]);
              applyQuery("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite/40 hover:text-charcoal"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((s, i) => (
                <li key={s.id}>
                  <Link
                    href={s.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      i === highlighted ? "bg-cream" : "hover:bg-cream"
                    }`}
                  >
                    <span className="relative block size-10 shrink-0 overflow-hidden rounded-md bg-cream">
                      {s.image && (
                        <Image
                          src={s.image}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-charcoal">
                        {s.name}
                      </span>
                      <PriceBlock price={s.price} mrp={s.mrp} size="sm" />
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-border">
                <button
                  type="button"
                  onClick={() => applyQuery(value)}
                  className="w-full px-4 py-2.5 text-left text-sm text-bronze hover:bg-cream"
                >
                  See all results for &quot;{value.trim()}&quot;
                </button>
              </li>
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-graphite/60">
              {loading ? "Searching..." : `No matches for "${value.trim()}".`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
