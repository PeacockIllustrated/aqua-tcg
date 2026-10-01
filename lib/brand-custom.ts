"use client";

import { useSyncExternalStore } from "react";
import type { ThemeName } from "@/lib/brand";

/**
 * Visitor-side brand override for pitch demos ("Pick your colours").
 *
 * A prospect can try their own colours, logo and shop name on the live
 * site. Everything is stored in this browser's localStorage only — it is
 * never sent to the server — and applied by <BrandStyle /> as CSS
 * variable overrides on <html>. Server renders always use the configured
 * brand (lib/brand.ts); custom values swap in after hydration (and
 * before first paint via the inline script in app/layout.tsx).
 */

export type CustomBrand = {
  preset?: ThemeName;
  brand?: string;
  tint?: string;
  highlight?: string;
  /** data: URL of an uploaded logo. */
  logo?: string;
  name?: string;
};

export const CUSTOM_BRAND_KEY = "shop:custom-brand";
const EVENT = "shop:custom-brand-change";

let cachedRaw: string | null | undefined;
let cachedValue: CustomBrand | null = null;

function read(): CustomBrand | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(CUSTOM_BRAND_KEY);
  } catch {
    raw = null;
  }
  // Stable snapshot identity for useSyncExternalStore.
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as CustomBrand) : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export function saveCustomBrand(next: CustomBrand | null): SaveResult {
  try {
    if (next && Object.values(next).some(Boolean)) {
      localStorage.setItem(CUSTOM_BRAND_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(CUSTOM_BRAND_KEY);
    }
  } catch {
    return {
      ok: false,
      error: "Couldn't save in this browser (storage is full or blocked).",
    };
  }
  window.dispatchEvent(new Event(EVENT));
  return { ok: true };
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Current override, or null. Always null during SSR + hydration. */
export function useCustomBrand(): CustomBrand | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** WCAG relative luminance → contrast ratio against ink and white. */
export function contrastInfo(hex: string): { ink: number; white: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { ink: 21, white: 21 };
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const L = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  const inkL = 0.0032; // #0a0a0a
  return { ink: (L + 0.05) / (inkL + 0.05), white: 1.05 / (L + 0.05) };
}

/**
 * Inline <head> script: applies a saved override before first paint so
 * there's no flash of the default colours. Kept tiny and dependency-free.
 */
export const BRAND_BOOT_SCRIPT = `try{var b=JSON.parse(localStorage.getItem(${JSON.stringify(
  CUSTOM_BRAND_KEY,
)})||"null");if(b){var r=document.documentElement;if(b.preset)r.dataset.theme=b.preset;["brand","tint","highlight"].forEach(function(k){if(b[k])r.style.setProperty("--color-"+k,b[k])})}}catch(e){}`;
