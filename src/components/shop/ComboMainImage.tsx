"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { SafeImage } from "./SafeImage";
import { ImageLightbox } from "./ImageLightbox";

export function ComboMainImage({
  src,
  alt,
  allImages,
}: {
  src: string;
  alt: string;
  allImages: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View full combo image"
        className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl bg-cream"
      >
        <SafeImage
          src={src}
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
      <ImageLightbox
        images={allImages}
        startIndex={0}
        open={open}
        onClose={() => setOpen(false)}
        alt={alt}
      />
    </>
  );
}
