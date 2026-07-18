"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { SafeImage } from "./SafeImage";
import { ImageLightbox } from "./ImageLightbox";

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
        <SafeImage
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
              <SafeImage
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

      <ImageLightbox
        images={images}
        startIndex={active}
        open={lightbox}
        onClose={() => setLightbox(false)}
        alt={alt}
      />
    </div>
  );
}
