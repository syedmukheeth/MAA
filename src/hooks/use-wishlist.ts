"use client";

import { useState, useEffect } from "react";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("maa-wishlist");
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch {
        setWishlist([]);
      }
    }
    setIsLoaded(true);
  }, []);

  const toggleWishlist = (productId: string) => {
    const next = wishlist.includes(productId)
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];
    setWishlist(next);
    localStorage.setItem("maa-wishlist", JSON.stringify(next));
    window.dispatchEvent(new Event("wishlist-change"));
  };

  const hasItem = (productId: string) => wishlist.includes(productId);

  useEffect(() => {
    const handleSync = () => {
      const stored = localStorage.getItem("maa-wishlist");
      if (stored) {
        try {
          setWishlist(JSON.parse(stored));
        } catch {
          setWishlist([]);
        }
      }
    };
    window.addEventListener("wishlist-change", handleSync);
    return () => window.removeEventListener("wishlist-change", handleSync);
  }, []);

  return { wishlist, toggleWishlist, hasItem, isLoaded };
}
