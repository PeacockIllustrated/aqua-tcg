"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { WaveDivider } from "@/components/cardbuy/WaveDivider";
import { NAV_SECTIONS } from "./sections";

/**
 * Sticky marketing header with anchor navigation and a scroll-spy
 * highlight.
 *
 * Deliberately links nowhere but this page: the shop, buylist, binder
 * and admin all still exist as routes, but the public site's surface is
 * the one-pager only.
 */
export function MarketingNav() {
  const [activeId, setActiveId] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  // Scroll-spy. `rootMargin` biases the observation band toward the top
  // of the viewport so a section counts as "current" once its heading
  // clears the sticky header, not when it happens to be centred.
  useEffect(() => {
    const targets = NAV_SECTIONS.map((s) =>
      document.getElementById(s.id),
    ).filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Close the mobile sheet on Escape — it covers the whole viewport, so
  // there's no click-away target on a phone.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      className="border-b-[3px] border-ink bg-paper-strong sticky top-0 z-30"
    >
      <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/aqua-tcg.svg"
            alt=""
            width={30}
            height={32}
            priority
            className="w-[26px] h-[28px] md:w-[30px] md:h-[32px]"
          />
          <span className="font-display text-[18px] md:text-[24px] tracking-tight leading-none">
            <span className="text-ocean">Aqua</span>
            <span className="text-sun">&nbsp;TCG</span>
          </span>
        </Link>

        {/* Desktop anchor nav */}
        <nav
          aria-label="Page sections"
          className="hidden md:flex items-center gap-0.5 font-display text-[12px] tracking-wider"
        >
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={activeId === s.id ? "true" : undefined}
              className={`px-3 py-1.5 border-2 rounded-sm transition-colors duration-100 ${
                activeId === s.id
                  ? "border-ink bg-ocean text-paper-strong"
                  : "border-transparent hover:border-ink hover:bg-wave"
              }`}
            >
              {s.short}
            </a>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="marketing-mobile-nav"
          className="md:hidden font-display text-[11px] tracking-wider px-3 py-1.5 border-2 border-ink rounded-sm bg-sun text-ink"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile sheet */}
      {menuOpen ? (
        <nav
          id="marketing-mobile-nav"
          aria-label="Page sections"
          className="md:hidden border-t-[3px] border-ink bg-paper-strong px-3 py-2 flex flex-col"
        >
          {NAV_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setMenuOpen(false)}
              className={`font-display text-[13px] tracking-wider px-3 py-2.5 border-b-2 border-ink/10 last:border-b-0 ${
                activeId === s.id ? "text-ocean" : "text-ink"
              }`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      ) : null}

      <WaveDivider fill="var(--color-ocean)" height={10} />
    </header>
  );
}
