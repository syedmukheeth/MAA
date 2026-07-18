"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

/**
 * Clickable gallery: thumbnails swap the main image, clicking the main image
 * opens a full-screen lightbox with prev/next and Esc to close.
 */
export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(
    () => setActive((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setActive((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, prev, next]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-cream text-sm text-graphite/40">
        No image
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label="View full image"
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-cream"
      >
        <Image
          src={images[active]}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-charcoal/60 p-2 text-ivory opacity-0 transition-opacity group-hover:opacity-100">
          <Expand size={16} />
        </span>
      </button>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-lg bg-cream transition-all ${
                i === active
                  ? "ring-2 ring-bronze"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${alt} — view ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} image viewer`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/95 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setLightbox(false)}
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
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
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
      )}
    </div>
  );
}
