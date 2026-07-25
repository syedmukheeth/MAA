"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "maa-wishlist";
const CHANGE_EVENT = "wishlist-change";
const EMPTY = "[]";

/**
 * localStorage is an external store, so it is read through
 * useSyncExternalStore rather than copied into state inside an effect. That
 * keeps the server render and the first client render consistent and avoids
 * the cascading re-render an effect-then-setState would cause.
 *
 * The snapshot is the raw JSON string: useSyncExternalStore compares snapshots
 * by identity, and `JSON.parse` would return a new array every call and loop
 * forever. Parsing happens once, memoised, after the comparison.
 */
function subscribe(onChange: () => void) {
  // Same tab dispatches CHANGE_EVENT; other tabs fire "storage".
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) ?? EMPTY;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useWishlist() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // False during SSR and the hydrating render, true afterwards — callers use
  // it to hold back UI that would otherwise flash an empty wishlist.
  const isLoaded = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const wishlist = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const current = (() => {
        try {
          const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? EMPTY);
          return Array.isArray(parsed) ? (parsed as string[]) : [];
        } catch {
          return [];
        }
      })();

      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    []
  );

  const hasItem = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist]
  );

  return { wishlist, toggleWishlist, hasItem, isLoaded };
}
