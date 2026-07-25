"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

const PLACEHOLDER = "/placeholder-furniture.svg";

/**
 * Falls back to a placeholder when the remote image 404s.
 *
 * The failed URL is remembered rather than the current one, so a new `src`
 * automatically gets a fresh attempt — no effect needed to reset the state.
 */
export function SafeImage({ src, alt, ...props }: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);

  const broken = failedSrc !== null && failedSrc === src;

  return (
    <Image
      {...props}
      src={broken || !src ? PLACEHOLDER : src}
      alt={alt}
      onError={() => setFailedSrc(src)}
    />
  );
}
