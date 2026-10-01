"use client";

import { brand } from "@/lib/brand";
import { useCustomBrand } from "@/lib/brand-custom";

/**
 * The shop's logo mark. Shows the visitor's uploaded logo (Pick your
 * colours) when there is one, otherwise the configured brand logo.
 * Plain <img> because uploads are data: URLs, which next/image can't
 * optimise anyway.
 */
export function BrandLogo({
  className = "",
  alt = "",
  priority = false,
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  const custom = useCustomBrand();
  const src = custom?.logo ?? brand.logo;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`.trim()}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
    />
  );
}
