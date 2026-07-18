"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ImageLightbox({
  images,
  startIndex = 0,
  open,
  onClose,
  alt = "Image viewer",
}: {
  images: string[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
  alt?: string;
}) {
  const [active, setActive] = useState(startIndex);

  // Sync active state when lightbox opens or startIndex changes
  useEffect(() => {
    if (open) {
      setActive(startIndex);
    }
  }, [open, startIndex]);

  const prev = useCallback(
    () => setActive((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setActive((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, prev, next]);

  if (!open || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/95 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close image viewer"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-ivory/10 p-2.5 text-ivory transition-colors hover:bg-ivory/20"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-ivory/10 p-2.5 text-ivory transition-colors hover:bg-ivory/20 sm:left-6"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div
        className="relative h-[85vh] w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[active]}
          alt={`${alt} — image ${active + 1}`}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>

      {images.length > 1 && (
        <button
          type="button"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-ivory/10 p-2.5 text-ivory transition-colors hover:bg-ivory/20 sm:right-6"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {images.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-ivory/70">
          {active + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
