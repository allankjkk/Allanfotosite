"use client";
import Image from "next/image";
export function Photograph({
  src,
  alt,
  width,
  height,
  priority = false,
  cover = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  cover?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 1600}
      height={height || 1067}
      priority={priority}
      sizes="(max-width: 767px) 92vw, (max-width: 1100px) 80vw, 1200px"
      className={cover ? "photo cover" : "photo"}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
}
