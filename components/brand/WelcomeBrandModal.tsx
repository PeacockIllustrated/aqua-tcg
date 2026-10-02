"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { brand, THEMES, THEME_PALETTES } from "@/lib/brand";
import { COLOUR_SLOTS, useBrandEditor } from "@/lib/brand-editor";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BrandWordmark } from "@/components/brand/BrandName";

/* ─── Open/closed store ────────────────────────────────────────────
 * Shown once per browser (remembered in localStorage). `?welcome` in
 * the URL, or reopenWelcome() (the picker's "Guided setup" link),
 * forces it open again — handy when pitching to several shops on one
 * laptop. Server snapshot is "closed" so SSR markup never includes it.
 */
const SEEN_KEY = "shop:welcome-seen";
const EVENT = "shop:welcome-change";

let forced =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("welcome");

function isOpen(): boolean {
  if (forced) return true;
  try {
    return localStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    // Storage blocked: don't nag on every page view.
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function markSeen() {
  forced = false;
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Non-critical.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Re-open the welcome flow (used by the header picker). */
export function reopenWelcome() {
  forced = true;
  window.dispatchEvent(new Event(EVENT));
}

/**
 * First-visit greeting for pitch demos: before the visitor looks at
 * anything, ask for their shop name, logo and colours, with a live
 * mini-preview of their storefront. Everything applies site-wide the
 * moment it changes (same store as the header "Pick your colours").
 */
export function WelcomeBrandModal() {
  const open = useSyncExternalStore(subscribe, isOpen, () => false);
  if (!open) return null;
  return <WelcomeDialog />;
}

function WelcomeDialog() {
  const {
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
  } = useBrandEditor();
  const [dragging, setDragging] = useState(false);
  const [showCustom, setShowCustom] = useState(hasCustomColours);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  // Lock page scroll + focus the name field while open; Escape skips.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") markSeen();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function onFile(file: File | undefined) {
    await uploadLogo(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  function finish() {
    markSeen();
    window.scrollTo({ top: 0 });
  }

  const name = custom?.name?.trim() || "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-ink/60 backdrop-blur-[3px] welcome-fade">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="welcome-pop relative w-full max-w-[1000px] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-xl border-[3px] border-ink bg-paper-strong shadow-[8px_8px_0_0_var(--color-ink)] grid md:grid-cols-[1.05fr_1fr]"
      >
        {/* ── Live preview (top on phones, right on desktop) ── */}
        <div className="order-first md:order-last relative bg-paper border-b-[3px] md:border-b-0 md:border-l-[3px] border-ink p-3 sm:p-6 flex flex-col gap-2 sm:gap-3 justify-center">
          <span className="font-display text-[10px] tracking-widest text-muted">
            Live preview
          </span>
          <MiniStorefront />
          <p className="hidden md:block text-[12px] text-muted">
            The whole site updates as you go: header, buttons, panels, the lot.
          </p>
        </div>

        {/* ── Setup ── */}
        <div className="p-5 sm:p-7 flex flex-col gap-5">
          <header className="flex flex-col gap-2">
            <span className="font-display text-[10px] tracking-widest bg-highlight border-2 border-ink px-2 py-1 rounded-sm w-fit">
              Welcome 👋
            </span>
            <h2 id={titleId} className="font-display text-[30px] sm:text-[40px] leading-[0.92] tracking-tight">
              Let&rsquo;s make it yours.
            </h2>
            <p className="text-[14px] text-secondary max-w-[44ch]">
              Pop in your shop name, logo and colours and the whole site
              dresses itself in your brand. Takes about 30 seconds.
            </p>
          </header>

          {/* 1 · Name */}
          <Step n={1} label="Your shop name">
            <input
              ref={nameRef}
              type="text"
              value={custom?.name ?? ""}
              placeholder={brand.name}
              maxLength={40}
              autoComplete="organization"
              onChange={(e) => update({ name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") fileRef.current?.focus();
              }}
              className="w-full border-[3px] border-ink rounded-md px-3 py-2.5 bg-paper-strong text-[16px] font-medium focus:outline-none focus:shadow-[3px_3px_0_0_var(--color-ink)]"
            />
          </Step>

          {/* 2 · Logo */}
          <Step n={2} label="Your logo" optional>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                onFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex items-center gap-4 rounded-md border-[3px] border-dashed px-4 py-3 cursor-pointer transition-colors focus-within:outline focus-within:outline-[3px] focus-within:outline-ink focus-within:outline-offset-2 ${
                dragging ? "border-ink bg-tint" : "border-ink/40 hover:border-ink hover:bg-paper"
              }`}
            >
              <span className="w-14 h-14 shrink-0 rounded-sm border-2 border-ink bg-paper-strong flex items-center justify-center overflow-hidden">
                <BrandLogo className="max-w-[85%] max-h-[85%]" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="font-display text-[12px] tracking-wider">
                  {busy ? "Reading…" : custom?.logo ? "Looking good. Drop another to swap" : "Drop your logo here"}
                </span>
                <span className="text-[12px] text-muted">
                  or tap to choose · PNG, JPG, SVG or WebP
                </span>
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                className="sr-only"
                disabled={busy}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </Step>

          {/* 3 · Colours */}
          <Step n={3} label="Your colours">
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((t) => {
                const p = THEME_PALETTES[t];
                const active = t === activePreset && !hasCustomColours;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      pickPreset(t);
                      setShowCustom(false);
                    }}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-md border-[3px] transition-transform ${
                      active ? "border-ink bg-paper -translate-y-0.5 shadow-[3px_3px_0_0_var(--color-ink)]" : "border-rule hover:border-ink"
                    }`}
                  >
                    <span aria-hidden="true" className="flex w-full h-7 rounded-sm overflow-hidden border-2 border-ink">
                      <span className="flex-1" style={{ background: p.brand }} />
                      <span className="flex-1" style={{ background: p.tint }} />
                      <span className="flex-1" style={{ background: p.highlight }} />
                    </span>
                    <span className="text-[11px] capitalize">{t}</span>
                  </button>
                );
              })}
            </div>

            {showCustom ? (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {COLOUR_SLOTS.map((slot) => (
                  <label key={slot.key} className="flex flex-col items-center gap-1 text-center">
                    <input
                      type="color"
                      value={current[slot.key]}
                      onChange={(e) => update({ [slot.key]: e.target.value })}
                      className="w-full h-10 cursor-pointer rounded-sm border-2 border-ink bg-paper-strong p-0.5"
                    />
                    <span className="text-[11px] leading-tight">{slot.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustom(true)}
                className="mt-2 text-[12px] underline underline-offset-2 text-secondary hover:text-ink w-fit"
              >
                Got brand colours? Use your own →
              </button>
            )}
            {lowContrast ? (
              <p className="text-[12px] text-warn mt-1">
                Text will be hard to read on that main colour. Try a lighter or darker shade.
              </p>
            ) : null}
          </Step>

          {error ? (
            <p role="alert" className="text-[13px] text-warn">
              {error}
            </p>
          ) : null}

          <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={markSeen}
              className="text-[13px] underline underline-offset-4 text-secondary hover:text-ink w-fit"
            >
              Skip, just show me the demo
            </button>
            <button
              type="button"
              onClick={finish}
              className="inline-flex justify-center items-center gap-2 bg-brand text-ink border-[3px] border-ink rounded-md px-6 py-3 font-display text-[15px] tracking-wider shadow-[4px_4px_0_0_var(--color-ink)] hover:shadow-[6px_6px_0_0_var(--color-ink)] hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
            >
              {name ? `Open ${name} →` : "Open my shop →"}
            </button>
          </footer>
          <p className="text-[11px] text-muted -mt-2">
            Saved in this browser only. Change it any time from{" "}
            <span className="font-display tracking-wider">Pick your colours</span> in the header.
          </p>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  label,
  optional,
  children,
}: {
  n: number;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 font-display text-[12px] tracking-wider">
        <span className="w-6 h-6 rounded-full bg-ink text-paper-strong flex items-center justify-center text-[11px]">
          {n}
        </span>
        {label}
        {optional ? <span className="text-muted font-sans normal-case tracking-normal text-[11px]">(optional)</span> : null}
      </h3>
      {children}
    </section>
  );
}

/** A miniature of the homepage, drawn with the live brand variables. */
function MiniStorefront() {
  return (
    <div
      aria-hidden="true"
      className="rounded-lg border-[3px] border-ink bg-paper-strong overflow-hidden shadow-[4px_4px_0_0_var(--color-ink)] select-none"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b-2 border-ink bg-paper">
        <span className="w-2 h-2 rounded-full bg-ink/25" />
        <span className="w-2 h-2 rounded-full bg-ink/25" />
        <span className="w-2 h-2 rounded-full bg-ink/25" />
      </div>
      {/* Nav */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b-2 border-ink">
        <span className="flex items-center gap-1.5 min-w-0">
          <BrandLogo className="w-5 h-5 shrink-0" />
          <span className="font-display text-[11px] tracking-tight truncate">
            <BrandWordmark lastClassName="text-brand" />
          </span>
        </span>
        <span className="flex gap-2 font-display text-[8px] tracking-wider shrink-0">
          <span>SHOP</span>
          <span>SELL</span>
          <span className="px-1 rounded-sm bg-highlight border border-ink">BASKET</span>
        </span>
      </div>
      {/* Hero */}
      <div className="relative bg-brand px-4 py-3 sm:py-6 flex items-center gap-3 overflow-hidden transition-colors duration-300">
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(var(--color-ink) 1.2px, transparent 1.2px)",
            backgroundSize: "12px 12px",
          }}
        />
        <span className="relative w-11 h-11 sm:w-16 sm:h-16 shrink-0 rounded-full bg-paper-strong/90 border-2 border-ink flex items-center justify-center">
          <BrandLogo className="w-[70%] h-[70%]" />
        </span>
        <span className="relative font-display uppercase leading-[0.9] tracking-tight text-[18px] sm:text-[26px] text-paper-strong [text-shadow:2px_2px_0_var(--color-ink)] break-words min-w-0">
          <BrandWordmark stacked lastClassName="text-highlight" />
        </span>
      </div>
      {/* Panels */}
      <div className="hidden sm:grid grid-cols-2 gap-2 p-3 bg-paper">
        <div className="rounded-md border-2 border-ink bg-highlight p-2.5 flex flex-col gap-1.5 transition-colors duration-300">
          <span className="font-display text-[7px] tracking-wider bg-ink text-paper-strong px-1 w-fit">SELL TO US</span>
          <span className="font-display text-[11px] leading-tight">Instant offers for your cards</span>
          <span className="mt-1 h-4 rounded-sm border-2 border-ink bg-brand" />
        </div>
        <div className="rounded-md border-2 border-ink bg-tint p-2.5 flex flex-col gap-1.5 transition-colors duration-300">
          <span className="font-display text-[7px] tracking-wider bg-ink text-paper-strong px-1 w-fit">BUY FROM US</span>
          <span className="font-display text-[11px] leading-tight">Hand-picked singles &amp; slabs</span>
          <span className="mt-1 h-4 rounded-sm border-2 border-ink bg-paper-strong" />
        </div>
      </div>
    </div>
  );
}
