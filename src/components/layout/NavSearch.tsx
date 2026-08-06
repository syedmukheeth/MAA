"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { SafeImage } from "@/components/shop/SafeImage";
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
 * Header search. Deliberately NOT shop/SearchBar.tsx, which is a listing-page
 * control: its applyQuery() merges window.location.search, so searching from
 * /cart?step=2 would carry that param onto /products, and its clear button
 * navigates — from a global header that means clicking X on any page bounces
 * you to the shop. This one always builds a fresh query and only navigates on
 * an explicit submit.
 *
 * Shares the /api/search endpoint (min 2 chars, max 8 results).
 */
export function NavSearch({
  /** Header state — over the hero the field must be ivory-on-glass. */
  solid,
  /** Mobile drawer renders it permanently open and full width. */
  variant = "expanding",
  onNavigate,
}: {
  solid: boolean;
  variant?: "expanding" | "inline";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const inline = variant === "inline";
  const [open, setOpen] = useState(inline);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const query = value.trim();
  const tooShort = query.length < 2;
  const visible = tooShort ? [] : suggestions;

  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&scope=products`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as { results: Suggestion[] };
        setSuggestions(data.results);
        setHighlighted(-1);
      } catch {
        // aborted or offline — keep whatever was already on screen
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Collapse on outside click. Skipped inline: inside the drawer there is no
  // "outside" that isn't the drawer closing anyway.
  useEffect(() => {
    if (inline) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [inline]);

  function submit() {
    if (!query) return;
    setOpen(inline);
    setValue("");
    onNavigate?.();
    // Fresh params, not window.location.search — see the note above.
    router.push(`/products?q=${encodeURIComponent(query)}`);
  }

  function go(href: string) {
    setOpen(inline);
    setValue("");
    onNavigate?.();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = highlighted >= 0 ? visible[highlighted] : undefined;
      if (hit) go(hit.href);
      else submit();
    } else if (e.key === "Escape") {
      if (value) setValue("");
      else if (!inline) {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
  }

  const fieldTone = inline
    ? "border-hairline bg-white text-charcoal placeholder:text-graphite/45"
    : solid
      ? "border-hairline bg-white/70 text-charcoal placeholder:text-graphite/45"
      : "border-ivory/25 bg-ivory/10 text-ivory placeholder:text-ivory/55";

  return (
    <div ref={rootRef} className={`relative ${inline ? "w-full" : ""}`}>
      {!inline && !open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            // Next paint — the input does not exist yet on this one.
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label="Search products"
          aria-expanded={false}
          className={`flex size-9 items-center justify-center rounded-full border transition-colors duration-300 ease-brand hover:border-bronze hover:text-bronze ${
            solid
              ? "border-hairline bg-white/60 text-graphite"
              : "border-ivory/25 text-ivory hover:bg-ivory/10"
          }`}
        >
          <Search size={15} />
        </button>
      ) : (
        <div
          className={
            inline
              ? "relative"
              : "relative w-[15rem] transition-[width] duration-500 ease-brand xl:w-[19rem]"
          }
        >
          <Search
            size={15}
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
              inline || solid ? "text-graphite/45" : "text-ivory/60"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search sofas, beds, dining…"
            aria-label="Search products"
            className={`h-9 w-full rounded-full border pl-9 pr-8 text-sm outline-none transition-colors duration-300 focus:border-bronze ${fieldTone}`}
          />
          {value && (
            <button
              type="button"
              aria-label="Clear search"
              // Clears the field only. Never navigates.
              onClick={() => {
                setValue("");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                inline || solid ? "text-graphite/45 hover:text-charcoal" : "text-ivory/60 hover:text-ivory"
              }`}
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {!tooShort && (open || inline) && (
        <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-2xl border border-hairline bg-white shadow-float">
          {visible.length > 0 ? (
            <ul>
              {visible.map((s, i) => (
                <li key={s.id}>
                  <Link
                    href={s.href}
                    onClick={() => go(s.href)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      i === highlighted ? "bg-cream" : "hover:bg-cream"
                    }`}
                  >
                    <span className="relative block size-10 shrink-0 overflow-hidden rounded-md bg-cream">
                      {s.image && (
                        <SafeImage src={s.image} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-charcoal">{s.name}</span>
                      <PriceBlock price={s.price} mrp={s.mrp} size="sm" />
                    </span>
                  </Link>
                </li>
              ))}
              <li className="border-t border-hairline">
                <button
                  type="button"
                  onClick={submit}
                  className="w-full px-4 py-2.5 text-left text-xs font-medium uppercase tracking-widest text-bronze hover:bg-cream"
                >
                  See all results
                </button>
              </li>
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-graphite/60">
              {loading ? "Searching…" : `No matches for “${query}”.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
