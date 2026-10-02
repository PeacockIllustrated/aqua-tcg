"use client";

import { useEffect } from "react";
import { useCustomBrand } from "@/lib/brand-custom";
import type { ThemeName } from "@/lib/brand";

const SLOTS = ["brand", "tint", "highlight"] as const;

/** Applies the visitor's "Pick your colours" override to <html>. */
export function BrandStyle({ defaultTheme }: { defaultTheme: ThemeName }) {
  const custom = useCustomBrand();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = custom?.preset ?? defaultTheme;
    for (const slot of SLOTS) {
      const value = custom?.[slot];
      if (value) root.style.setProperty(`--color-${slot}`, value);
      else root.style.removeProperty(`--color-${slot}`);
    }
  }, [custom, defaultTheme]);

  return null;
}
