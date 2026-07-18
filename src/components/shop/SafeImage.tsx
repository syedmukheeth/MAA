"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

export function SafeImage({ src, alt, ...props }: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc || "/placeholder-furniture.svg"}
      alt={alt}
      onError={() => {
        setImgSrc("/placeholder-furniture.svg");
      }}
    />
  );
}
