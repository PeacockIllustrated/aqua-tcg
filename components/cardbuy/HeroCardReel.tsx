"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "@/lib/types/card";
import { CardImage } from "./CardImage";

type Tier = {
  label: string;
  /** Rarity string the /search filter expects. */
  rarity: string;
  /** Printed rarity symbol. */
  symbol: string;
  blurb: string;
  pullRate: string;
  /** Typical GBP offer range on the buylist. */
  offer: string;
  examples: string[];
  /** Stage background (inline CSS so each tier keeps its own colour
   *  regardless of the shop's brand theme). */
  bg: string;
  /** Dark tiers flip the text colour. */
  dark?: boolean;
};

/**
 * Rarity tiers. Colours are rarity-semantic (not brand tokens) so the
 * ladder always reads as a climb, whatever colourway the shop picks.
 */
const TIERS: Tier[] = [
  {
    label: "Common",
    rarity: "Common",
    symbol: "●",
    blurb:
      "The everyday pull. Bulk that builds first decks and first collections, and we still buy it by the stack.",
    pullRate: "7 in every pack",
    offer: "£0.10 – £0.50",
    examples: ["Pikachu", "Gastly", "Caterpie"],
    bg: "#e9e7e2",
  },
  {
    label: "Uncommon",
    rarity: "Uncommon",
    symbol: "◆",
    blurb:
      "Stage 1 evolutions and key trainers. The backbone of every playable deck.",
    pullRate: "3 in every pack",
    offer: "£0.30 – £2",
    examples: ["Haunter", "Machoke", "Ivysaur"],
    bg: "#cdebd5",
  },
  {
    label: "Rare",
    rarity: "Rare",
    symbol: "★",
    blurb:
      "One in every pack. Stage 2 Pokémon and signature trainers, and the first cards worth sleeving.",
    pullRate: "1 in every pack",
    offer: "£2 – £25",
    examples: ["Beedrill", "Dragonair", "Hitmonlee"],
    bg: "#cadcf6",
  },
  {
    label: "Rare Holo",
    rarity: "Rare Holo",
    symbol: "★",
    blurb:
      "Foil fronts and chase-card energy. The cards everyone remembers from the playground.",
    pullRate: "About 1 in 3 packs",
    offer: "£30 – £1,000+",
    examples: ["Charizard", "Blastoise", "Mewtwo"],
    bg: "conic-gradient(from 210deg at 35% 45%, #ffd6f2, #c9f0ff, #d8ffd0, #fff2b3, #ffd9c2, #ffd6f2)",
  },
  {
    label: "Promo & chase",
    rarity: "Promo",
    symbol: "✦",
    blurb:
      "Out-of-set legends: event exclusives, movie promos and first editions. Hunted forever.",
    pullRate: "Events & boxes only",
    offer: "£80 – £10,000+",
    examples: ["Mew", "Ivy Pikachu", "Ancient Mew"],
    bg: "#121212",
    dark: true,
  },
];

const N = TIERS.length;

type Props = {
  /** Expects exactly five cards in ascending-rarity order. */
  cards: [Card, Card, Card, Card, Card];
};

/** Hold each tier for a moment before easing to the next. */
function dwell(p: number): number {
  const seg = p * (N - 1);
  const base = Math.floor(seg);
  const f = seg - base;
  const t = Math.min(1, Math.max(0, (f - 0.3) / 0.4));
  return Math.min(N - 1, base + t * t * (3 - 2 * t));
}

/**
 * The rarity ladder: five tiers from bulk commons to chase promos.
 *
 *   • Desktop (md+) — a pinned stage driven by page scroll. The card
 *     fan interpolates continuously; copy swaps per tier with a short
 *     slide-in. The ladder rail along the bottom is clickable.
 *   • Mobile — no scroll-jacking: a swipeable snap carousel with tier
 *     tabs, one full slide per tier.
 */
export function HeroCardReel({ cards }: Props) {
  return (
    <section aria-label="The rarity ladder" className="bg-paper">
      <DesktopLadder cards={cards} />
      <MobileLadder cards={cards} />
    </section>
  );
}

/* ─── Desktop ──────────────────────────────────────────────────── */

function DesktopLadder({ cards }: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    let queued = false;

    const update = () => {
      queued = false;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = Math.max(1, rect.height - vh);
      const p = Math.min(1, Math.max(0, -rect.top / total));
      const pos = dwell(p);
      const activeI = Math.round(pos);

      // Scale the fan to the stage height so the hero card stays big
      // on short and tall screens alike (CardImage lg = 280×392).
      const stageH = stageRef.current?.clientHeight ?? 600;
      const base = Math.min(1.25, Math.max(0.7, (stageH * 0.62) / 392));

      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        const off = i - pos;
        const abs = Math.abs(off);
        const tx = off * 46;
        const ty = abs * 4;
        const rotY = -off * 18;
        const rotZ = off * 4;
        const scale = base * Math.max(0.5, 1 - abs * 0.22);
        el.style.transform =
          `translate(-50%, -50%) translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) ` +
          `rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = Math.max(0, 1 - abs * 0.38).toFixed(3);
        el.style.zIndex = String(100 - Math.round(abs * 10));
        el.style.filter = abs > 0.5 ? `saturate(${Math.max(0.3, 1 - abs * 0.35).toFixed(2)})` : "";

        const inner = el.querySelector<HTMLElement>(".card-3d");
        if (inner) {
          const isActive = i === activeI;
          inner.classList.toggle("card-3d-engaged", isActive);
          const mix = pos - activeI;
          inner.style.setProperty("--rx", isActive ? `${(mix * 12).toFixed(2)}deg` : "0deg");
          inner.style.setProperty("--ry", isActive ? `${(-mix * 16).toFixed(2)}deg` : "0deg");
          inner.style.setProperty("--lift", isActive ? "24px" : "0px");
        }
      });

      if (fillRef.current) fillRef.current.style.transform = `scaleX(${(pos / (N - 1)).toFixed(4)})`;

      if (activeI !== activeRef.current) {
        activeRef.current = activeI;
        setActive(activeI);
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /** Scroll the page so tier `i` sits in the middle of its dwell. */
  const goTo = useCallback((i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const total = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (total * i) / (N - 1), behavior: "smooth" });
  }, []);

  const tier = TIERS[active];
  const ink = tier.dark ? "text-paper-strong" : "text-ink";
  const soft = tier.dark ? "text-paper-strong/70" : "text-secondary";

  return (
    <div
      ref={sectionRef}
      className="hidden md:block relative px-4"
      style={{ height: `calc(100vh + ${N - 1} * 70vh)` }}
    >
      {/* Same content column as the rest of the site (1300px minus its 16px gutters); height capped so
          the stage doesn't balloon on tall screens. */}
      <div className="sticky top-[88px] max-w-[1268px] mx-auto h-[min(calc(100vh-112px),760px)] min-h-[540px] py-2">
        <div
          className="relative h-full rounded-xl border-[3px] border-ink shadow-[6px_6px_0_0_var(--color-ink)] overflow-hidden flex flex-col transition-[background] duration-700"
          style={{ background: tier.bg }}
        >
          {/* Halftone texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(${tier.dark ? "rgba(255,255,255,0.09)" : "rgba(10,10,10,0.09)"} 1.4px, transparent 1.6px)`,
              backgroundSize: "16px 16px",
            }}
          />

          {/* Header */}
          <div className="relative z-20 flex items-center justify-between px-6 lg:px-8 pt-5">
            <div className="flex items-center gap-3">
              <span
                className={`font-display text-[11px] tracking-widest bg-ink text-paper-strong border-2 px-2 py-1 rounded-sm ${
                  tier.dark ? "border-paper-strong/60" : "border-ink"
                }`}
              >
                The rarity ladder
              </span>
              <span className={`hidden lg:inline text-[13px] ${soft}`}>
                Bulk to grails — we buy every rung.
              </span>
            </div>
            <span className={`font-display text-[10px] tracking-widest ${soft} flex items-center gap-2`}>
              Scroll to climb
              <span aria-hidden="true" className="motion-safe:animate-bounce">↓</span>
            </span>
          </div>

          <div className="relative flex-1 grid grid-cols-[1.05fr_1fr] min-h-0">
            {/* Card stage */}
            <div ref={stageRef} className="relative [perspective:1400px] min-h-0">
              <span
                aria-hidden="true"
                className={`absolute inset-0 flex items-center justify-center select-none pointer-events-none leading-none transition-colors duration-700 ${
                  tier.dark ? "text-[#f5c832]/15" : "text-ink/[0.07]"
                }`}
                style={{ fontSize: "min(52vh, 34vw)" }}
              >
                {tier.symbol}
              </span>
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  ref={(el) => {
                    cardsRef.current[i] = el;
                  }}
                  className="absolute top-1/2 left-1/2 will-change-transform"
                  style={{
                    transform: "translate(-50%, -50%)",
                    transition: "transform 160ms cubic-bezier(0.2,0.8,0.2,1), opacity 160ms linear",
                  }}
                >
                  <CardImage src={card.images.large} alt={card.name} size="lg" rarity={card.rarity} />
                </div>
              ))}
            </div>

            {/* Copy */}
            <div className={`relative z-10 flex flex-col justify-center gap-5 pr-8 lg:pr-12 pl-2 ${ink}`}>
              <div key={active} className="tier-in flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[15px] w-10 h-10 rounded-full border-[3px] border-ink bg-paper-strong text-ink flex items-center justify-center">
                    {tier.symbol}
                  </span>
                  <span className={`font-display text-[12px] tracking-widest ${soft} tabular-nums`}>
                    Tier {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                  </span>
                </div>

                <h2
                  className="font-display uppercase leading-[0.88] tracking-tight text-[clamp(44px,5.6vw,92px)]"
                  style={{
                    textShadow: tier.dark ? "4px 4px 0 #f5c832" : "4px 4px 0 var(--color-paper-strong)",
                  }}
                >
                  {tier.label}
                </h2>

                <p className={`text-[16px] lg:text-[17px] leading-relaxed max-w-[40ch] ${soft}`}>
                  {tier.blurb}
                </p>

                <dl className="grid grid-cols-[1.35fr_1fr] gap-3 max-w-[520px]">
                  <div
                    className="pop-card rounded-md px-4 py-3 bg-highlight text-ink"
                    style={tier.dark ? { boxShadow: "3px 3px 0 0 #f5c832" } : undefined}
                  >
                    <dt className="font-display text-[10px] tracking-widest opacity-70">Typical offer</dt>
                    <dd className="font-display text-[clamp(18px,1.75vw,26px)] leading-tight tabular-nums whitespace-nowrap">{tier.offer}</dd>
                  </div>
                  <div
                    className="pop-card rounded-md px-4 py-3 text-ink"
                    style={tier.dark ? { boxShadow: "3px 3px 0 0 #f5c832" } : undefined}
                  >
                    <dt className="font-display text-[10px] tracking-widest opacity-70">Pull rate</dt>
                    <dd className="font-display text-[clamp(16px,1.5vw,20px)] leading-tight">{tier.pullRate}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-display text-[10px] tracking-widest ${soft}`}>Look out for</span>
                  {tier.examples.map((e) => (
                    <span
                      key={e}
                      className="font-display text-[11px] tracking-wider bg-paper-strong text-ink border-2 border-ink rounded-full px-2.5 py-0.5"
                    >
                      {e}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/search?rarity=${encodeURIComponent(tier.rarity)}`}
                  className={`w-fit inline-flex items-center gap-2 bg-brand text-ink border-[3px] rounded-md px-5 py-3 font-display text-[14px] tracking-wider transition-all hover:-translate-x-px hover:-translate-y-px ${
                    tier.dark
                      ? "border-paper-strong shadow-[4px_4px_0_0_#f5c832]"
                      : "border-ink shadow-[4px_4px_0_0_var(--color-ink)] hover:shadow-[6px_6px_0_0_var(--color-ink)]"
                  }`}
                >
                  Sell your {tier.label.toLowerCase()} cards →
                </Link>
              </div>
            </div>
          </div>

          {/* Ladder rail */}
          <nav aria-label="Rarity tiers" className="relative z-20 border-t-[3px] border-ink bg-paper-strong">
            <div
              ref={fillRef}
              aria-hidden="true"
              className="absolute left-0 right-0 top-0 h-[4px] bg-brand origin-left"
              style={{ transform: "scaleX(0)" }}
            />
            <ol className="grid grid-cols-5">
              {TIERS.map((t, i) => {
                const on = i === active;
                const done = i < active;
                return (
                  <li key={t.label} className={i > 0 ? "border-l-2 border-ink/15" : ""}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={on ? "step" : undefined}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors ${
                        on ? "bg-ink text-paper-strong" : "hover:bg-tint"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[12px] ${
                          on
                            ? "border-paper-strong bg-highlight text-ink"
                            : done
                              ? "border-ink bg-ink text-paper-strong"
                              : "border-ink bg-paper-strong text-ink"
                        }`}
                      >
                        {t.symbol}
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className={`font-display text-[9px] tracking-widest ${on ? "text-paper-strong/60" : "text-muted"}`}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-[12px] tracking-wider truncate">{t.label}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile ───────────────────────────────────────────────────── */

function MobileLadder({ cards }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slides = Array.from(track.children) as HTMLElement[];
        const mid = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestD = Infinity;
        slides.forEach((s, i) => {
          const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        setActive(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Keep the active tab visible — scroll only the tab strip, never the page.
  useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !tab) return;
    strip.scrollTo({
      left: tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const slide = track?.children[i] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  return (
    <div className="md:hidden py-10 flex flex-col gap-4">
      <header className="px-5 flex flex-col gap-2">
        <span className="font-display text-[10px] tracking-widest bg-ink text-paper-strong px-2 py-1 rounded-sm w-fit">
          The rarity ladder
        </span>
        <h2 className="font-display text-[30px] leading-[0.95] tracking-tight">
          Bulk to grails. We buy every rung.
        </h2>
        <p className="text-[14px] text-secondary">Swipe through the five tiers and see what each one is worth.</p>
      </header>

      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Rarity tiers"
        className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]"
      >
        {TIERS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => goTo(i)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-2 border-ink rounded-full font-display text-[11px] tracking-wider transition-colors ${
              i === active ? "bg-ink text-paper-strong" : "bg-paper-strong"
            }`}
          >
            <span aria-hidden="true">{t.symbol}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 pb-3 [scrollbar-width:none]"
      >
        {TIERS.map((t, i) => {
          const card = cards[i];
          const ink = t.dark ? "text-paper-strong" : "text-ink";
          const soft = t.dark ? "text-paper-strong/70" : "text-secondary";
          return (
            <article
              key={t.label}
              aria-label={`${t.label} tier`}
              className={`relative snap-center shrink-0 w-[86%] rounded-xl border-[3px] border-ink shadow-[4px_4px_0_0_var(--color-ink)] overflow-hidden flex flex-col ${ink}`}
              style={{ background: t.bg }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(${t.dark ? "rgba(255,255,255,0.09)" : "rgba(10,10,10,0.08)"} 1.3px, transparent 1.5px)`,
                  backgroundSize: "14px 14px",
                }}
              />
              <div className="relative h-[230px] flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className={`absolute text-[220px] leading-none select-none ${t.dark ? "text-[#f5c832]/15" : "text-ink/[0.07]"}`}
                >
                  {t.symbol}
                </span>
                <div className="relative rotate-[-4deg] scale-[0.86]">
                  <CardImage src={card.images.large} alt={card.name} size="md" rarity={card.rarity} static />
                </div>
              </div>
              <div className="relative flex flex-col gap-3 px-5 pb-5">
                <span className={`font-display text-[10px] tracking-widest ${soft}`}>
                  {t.symbol} Tier {String(i + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                </span>
                <h3 className="font-display uppercase text-[30px] leading-[0.9] tracking-tight">{t.label}</h3>
                <p className={`text-[14px] leading-relaxed ${soft}`}>{t.blurb}</p>
                <dl className="grid grid-cols-[1.3fr_1fr] gap-2">
                  <div
                    className="pop-card rounded-md px-3 py-2 bg-highlight text-ink"
                    style={t.dark ? { boxShadow: "3px 3px 0 0 #f5c832" } : undefined}
                  >
                    <dt className="font-display text-[9px] tracking-widest opacity-70">Typical offer</dt>
                    <dd className="font-display text-[15px] leading-tight tabular-nums whitespace-nowrap">{t.offer}</dd>
                  </div>
                  <div
                    className="pop-card rounded-md px-3 py-2 text-ink"
                    style={t.dark ? { boxShadow: "3px 3px 0 0 #f5c832" } : undefined}
                  >
                    <dt className="font-display text-[9px] tracking-widest opacity-70">Pull rate</dt>
                    <dd className="font-display text-[13px] leading-tight">{t.pullRate}</dd>
                  </div>
                </dl>
                <p className={`text-[12px] ${soft}`}>
                  <span className="font-display text-[10px] tracking-widest">Look out for: </span>
                  {t.examples.join(", ")}
                </p>
                <Link
                  href={`/search?rarity=${encodeURIComponent(t.rarity)}`}
                  className={`mt-1 inline-flex justify-center items-center bg-brand text-ink border-[3px] rounded-md px-3 py-2.5 font-display text-[12px] tracking-wider text-center ${
                    t.dark ? "border-paper-strong shadow-[3px_3px_0_0_#f5c832]" : "border-ink shadow-[3px_3px_0_0_var(--color-ink)]"
                  }`}
                >
                  Get offers on {t.label.toLowerCase()} →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 px-5">
        <button
          type="button"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Previous tier"
          className="w-10 h-10 border-2 border-ink rounded-full bg-paper-strong font-display disabled:opacity-30"
        >
          ←
        </button>
        <div className="flex gap-1.5" aria-hidden="true">
          {TIERS.map((t, i) => (
            <span
              key={t.label}
              className={`h-2 rounded-full border border-ink transition-all ${i === active ? "w-6 bg-ink" : "w-2 bg-paper-strong"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(Math.min(N - 1, active + 1))}
          disabled={active === N - 1}
          aria-label="Next tier"
          className="w-10 h-10 border-2 border-ink rounded-full bg-paper-strong font-display disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}
