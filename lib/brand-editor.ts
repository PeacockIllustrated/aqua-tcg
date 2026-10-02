"use client";

import { useState } from "react";
import { brand, THEME_PALETTES, type ThemeName } from "@/lib/brand";
import {
  contrastInfo,
  saveCustomBrand,
  useCustomBrand,
  type CustomBrand,
} from "@/lib/brand-custom";

export const COLOUR_SLOTS = [
  { key: "brand", label: "Main colour", hint: "Header band, buttons, featured" },
  { key: "tint", label: "Second colour", hint: "Buy panels, badges" },
  { key: "highlight", label: "Accent", hint: "Wordmark, sell panels, stickers" },
] as const;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SVG_BYTES = 300 * 1024;
const LOGO_PX = 400;

/** Raster → downscaled PNG data URL so it fits comfortably in storage. */
async function rasterToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LOGO_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/png");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Shared state + actions for editing the visitor's brand override.
 * Used by the header popover (<BrandPicker />) and the first-visit
 * welcome modal (<WelcomeBrandModal />) so both behave identically.
 */
export function useBrandEditor() {
  const custom = useCustomBrand();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activePreset: ThemeName = custom?.preset ?? brand.theme;
  const palette = THEME_PALETTES[activePreset];
  const current = {
    brand: custom?.brand ?? palette.brand,
    tint: custom?.tint ?? palette.tint,
    highlight: custom?.highlight ?? palette.highlight,
  };
  const hasCustomColours = Boolean(custom?.brand || custom?.tint || custom?.highlight);
  const contrast = contrastInfo(current.brand);
  const lowContrast = contrast.ink < 3 && contrast.white < 3;

  function update(patch: Partial<CustomBrand>) {
    const res = saveCustomBrand({ ...(custom ?? {}), ...patch });
    setError(res.ok ? null : res.error);
  }

  function pickPreset(preset: ThemeName) {
    update({ preset, brand: undefined, tint: undefined, highlight: undefined });
  }

  /** Returns true when the logo was saved. */
  async function uploadLogo(file: File | undefined): Promise<boolean> {
    if (!file) return false;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Try a PNG, JPG, SVG or WebP.");
      return false;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is over 5 MB. Try a smaller file.");
      return false;
    }
    setBusy(true);
    try {
      let dataUrl: string;
      if (file.type === "image/svg+xml") {
        if (file.size > MAX_SVG_BYTES) {
          setError("That SVG is over 300 KB. Try a simpler file or a PNG.");
          return false;
        }
        dataUrl = await fileToDataUrl(file);
      } else {
        dataUrl = await rasterToDataUrl(file);
      }
      update({ logo: dataUrl });
      return true;
    } catch {
      setError("Couldn't read that image. Try another file.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    saveCustomBrand(null);
    setError(null);
  }

  return {
    custom,
    error,
    busy,
    activePreset,
    current,
    hasCustomColours,
    lowContrast,
    update,
    pickPreset,
    uploadLogo,
    reset,
  };
}
