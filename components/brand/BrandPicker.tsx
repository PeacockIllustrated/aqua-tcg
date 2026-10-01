"use client";

import { useEffect, useId, useRef, useState } from "react";
import { brand, THEMES, THEME_PALETTES, type ThemeName } from "@/lib/brand";
import {
  contrastInfo,
  saveCustomBrand,
  useCustomBrand,
  type CustomBrand,
} from "@/lib/brand-custom";

const SLOTS = [
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
 * "Pick your colours" — the nav-bar panel a prospect uses to see the
 * site in their own brand: colour presets, three custom colours, a logo
 * upload and their shop name. Saved in this browser only.
 */
export function BrandPicker() {
  const custom = useCustomBrand();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

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

  // Close on Escape / outside click.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function update(patch: Partial<CustomBrand>) {
    const res = saveCustomBrand({ ...(custom ?? {}), ...patch });
    setError(res.ok ? null : res.error);
  }

  function pickPreset(preset: ThemeName) {
    update({ preset, brand: undefined, tint: undefined, highlight: undefined });
  }

  async function onLogo(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Try a PNG, JPG, SVG or WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is over 5 MB. Try a smaller file.");
      return;
    }
    setBusy(true);
    try {
      let dataUrl: string;
      if (file.type === "image/svg+xml") {
        if (file.size > MAX_SVG_BYTES) {
          setError("That SVG is over 300 KB. Try a simpler file or a PNG.");
          return;
        }
        dataUrl = await fileToDataUrl(file);
      } else {
        dataUrl = await rasterToDataUrl(file);
      }
      update({ logo: dataUrl });
    } catch {
      setError("Couldn't read that image. Try another file.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2 md:px-2.5 py-1 border-2 border-ink rounded-sm font-display text-[10px] md:text-[11px] tracking-wider transition-colors ${
          open ? "bg-ink text-paper-strong" : "bg-paper-strong hover:bg-tint"
        }`}
      >
        <span
          aria-hidden="true"
          className="flex -space-x-1"
        >
          <span className="w-2.5 h-2.5 rounded-full border border-ink bg-brand" />
          <span className="w-2.5 h-2.5 rounded-full border border-ink bg-tint" />
          <span className="w-2.5 h-2.5 rounded-full border border-ink bg-highlight" />
        </span>
        <span className="sr-only lg:not-sr-only">Pick your colours</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Pick your colours"
          className="pop-card rounded-md p-4 flex flex-col gap-4 z-50 fixed left-3 right-3 top-[64px] max-h-[calc(100dvh-80px)] overflow-y-auto sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[340px] font-sans normal-case tracking-normal text-[13px]"
        >
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[16px] leading-tight">Pick your colours</h2>
              <p className="text-[12px] text-muted mt-0.5">
                See the site in your brand. Saved in this browser only.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-display text-[11px] px-1.5 py-0.5 border-2 border-ink rounded-sm hover:bg-ink hover:text-paper-strong"
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          {/* Presets */}
          <fieldset className="flex flex-col gap-2">
            <legend className="font-display text-[10px] tracking-wider text-muted mb-2">
              START FROM A PRESET
            </legend>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => {
                const p = THEME_PALETTES[t];
                const active = t === activePreset && !hasCustomColours;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => pickPreset(t)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-sm border-2 ${
                      active ? "border-ink bg-paper" : "border-rule hover:border-ink"
                    }`}
                  >
                    <span aria-hidden="true" className="flex w-full h-5 rounded-sm overflow-hidden border border-ink">
                      <span className="flex-1" style={{ background: p.brand }} />
                      <span className="flex-1" style={{ background: p.tint }} />
                      <span className="flex-1" style={{ background: p.highlight }} />
                    </span>
                    <span className="text-[10px] capitalize">{t}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Custom colours */}
          <fieldset className="flex flex-col gap-2">
            <legend className="font-display text-[10px] tracking-wider text-muted mb-2">
              OR USE YOUR OWN
            </legend>
            {SLOTS.map((slot) => (
              <label key={slot.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={current[slot.key]}
                  onChange={(e) => update({ [slot.key]: e.target.value })}
                  className="w-9 h-9 shrink-0 cursor-pointer rounded-sm border-2 border-ink bg-paper-strong p-0.5"
                />
                <span className="flex flex-col min-w-0">
                  <span className="font-medium">{slot.label}</span>
                  <span className="text-[11px] text-muted truncate">{slot.hint}</span>
                </span>
                <code className="ml-auto text-[11px] text-secondary uppercase tabular">
                  {current[slot.key]}
                </code>
              </label>
            ))}
            {lowContrast ? (
              <p className="text-[11px] text-warn">
                Text will be hard to read on this main colour. Try a lighter or
                darker shade.
              </p>
            ) : null}
          </fieldset>

          {/* Logo */}
          <fieldset className="flex flex-col gap-2">
            <legend className="font-display text-[10px] tracking-wider text-muted mb-2">
              YOUR LOGO
            </legend>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 shrink-0 rounded-sm border-2 border-ink bg-paper flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={custom?.logo ?? brand.logo}
                  alt=""
                  className="max-w-[85%] max-h-[85%] object-contain"
                />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <label className="inline-flex w-fit cursor-pointer items-center px-2.5 py-1 border-2 border-ink rounded-sm bg-highlight font-display text-[10px] tracking-wider hover:bg-tint focus-within:outline focus-within:outline-[3px] focus-within:outline-ink focus-within:outline-offset-2">
                  {busy ? "Reading…" : custom?.logo ? "Replace logo" : "Upload logo"}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => onLogo(e.target.files?.[0])}
                  />
                </label>
                {custom?.logo ? (
                  <button
                    type="button"
                    onClick={() => update({ logo: undefined })}
                    className="w-fit text-[11px] underline underline-offset-2 text-secondary hover:text-ink"
                  >
                    Remove logo
                  </button>
                ) : (
                  <span className="text-[11px] text-muted">PNG, JPG, SVG or WebP. Square works best.</span>
                )}
              </div>
            </div>
          </fieldset>

          {/* Name */}
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] tracking-wider text-muted">SHOP NAME</span>
            <input
              type="text"
              value={custom?.name ?? ""}
              placeholder={brand.name}
              maxLength={40}
              onChange={(e) => update({ name: e.target.value })}
              className="border-2 border-ink rounded-sm px-2.5 py-1.5 bg-paper-strong text-[14px]"
            />
          </label>

          {error ? (
            <p role="alert" className="text-[12px] text-warn">
              {error}
            </p>
          ) : null}

          <footer className="flex items-center justify-between gap-3 pt-1 border-t-2 border-rule">
            <button
              type="button"
              onClick={() => {
                saveCustomBrand(null);
                setError(null);
              }}
              disabled={!custom}
              className="text-[12px] underline underline-offset-2 text-secondary hover:text-ink disabled:opacity-40 disabled:no-underline"
            >
              Reset to default
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 border-2 border-ink rounded-sm bg-brand font-display text-[11px] tracking-wider shadow-[3px_3px_0_0_var(--color-ink)] hover:shadow-[4px_4px_0_0_var(--color-ink)]"
            >
              Looks good
            </button>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
