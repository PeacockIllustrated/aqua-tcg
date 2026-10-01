"use client";

import { useEffect, useState } from "react";
import { THEMES, type ThemeName } from "@/lib/brand";

const STORAGE_KEY = "shop:demo-theme";

const SWATCH: Record<ThemeName, string> = {
  neutral: "#6b7280",
  ember: "#e2553b",
  forest: "#2f9e6e",
  violet: "#7c5cd6",
};

/**
 * Pitch-demo colourway switcher. Only rendered when
 * NEXT_PUBLIC_DEMO_MODE=true, so a prospect can see the site in a few
 * colourways live. Flips `data-theme` on <html>; globals.css does the rest.
 */
export function ThemeSwitcher({ initial }: { initial: ThemeName }) {
  // Lazy init reads the saved demo choice on the client; the server
  // renders `initial`. The panel starts closed, so markup matches.
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && (THEMES as readonly string[]).includes(saved)
        ? (saved as ThemeName)
        : initial;
    } catch {
      return initial;
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage blocked — non-critical.
    }
  }, [theme]);

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end font-display text-[10px] tracking-wider">
      {open ? (
        <div className="pop-card rounded-md p-2 flex flex-col gap-1.5 mb-2 w-[150px]">
          <span className="text-muted px-1">Demo colourway</span>
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`flex items-center gap-2 px-1.5 py-1 rounded-sm border-2 text-left ${
                t === theme ? "border-ink bg-paper" : "border-transparent hover:border-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className="w-3.5 h-3.5 rounded-full border-2 border-ink"
                style={{ background: SWATCH[t] }}
              />
              {t}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="pop-card rounded-md px-2.5 py-1.5 bg-ink text-paper-strong"
      >
        {open ? "Close" : "Your colours here ◐"}
      </button>
    </div>
  );
}
