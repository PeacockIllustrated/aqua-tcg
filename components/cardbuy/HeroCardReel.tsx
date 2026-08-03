"use client";

import { useEffect, useRef } from "react";
import type { Card } from "@/lib/types/card";
import { CardImage } from "./CardImage";

/** A stat pair rendered in the reel's detail panel. */
export type ReelStat = { label: string; value: string };

export type ReelTier = {
  label: string;
  blurb: string;
  /** Rendered as a `<dl>`. Entries past the second span both columns. */
  stats: ReelStat[];
  /** Backdrop colour behind the stage. Must be one of STAGE_BG_CLASSES. */
  bg: string;
  /** Wordmark tint. Must be one of LABEL_TINT_CLASSES. */
  tint: string;
  /** Accent chip colour for the tier pill. Must be in STAGE_BG_CLASSES. */
  chipBg: string;
};

/**
 * Every background/tint class the reel swaps between at runtime.
 *
 * Tailwind only emits classes it can see as complete literals at build
 * time, and these are applied imperatively from the scroll handler — so
 * they're listed here to keep them in the compiled stylesheet, and to
 * bound what `classList.remove()` has to clear between tiers.
 */
const STAGE_BG_CLASSES = [
  "bg-paper-strong",
  "bg-wave",
  "bg-sun",
  "bg-ocean",
  "bg-ink",
] as const;

/**
 * Valid `tint` values. Same build-time-literal reasoning as above.
 *
 * All of these must stay readable against the near-opaque paper wash the
 * detail panel sits on — the panel does NOT darken with the tier, so a
 * light tint (e.g. `text-sun`) would disappear. The tier's own drama is
 * carried by the card stage and the chip, not by the panel's text colour.
 */
const LABEL_TINT_CLASSES = ["text-muted", "text-ink", "text-ocean"] as const;

/**
 * Default tier set — the Pokémon rarity ladder, used by the platform
 * homepage. The marketing one-pager passes its own tiers.
 */
export const RARITY_TIERS: ReelTier[] = [
  {
    label: "COMMON",
    blurb:
      "The everyday pull. Bulk cards that build energy decks and first collections.",
    stats: [
      { label: "PULL RATE", value: "~70% of pulls" },
      { label: "BUY RANGE", value: "£0.10 – £0.50" },
      { label: "NOTABLE", value: "Pikachu · Gastly · Caterpie" },
    ],
    bg: "bg-paper-strong",
    tint: "text-muted",
    chipBg: "bg-paper-strong",
  },
  {
    label: "UNCOMMON",
    blurb:
      "Stage-1 evolutions and key trainers. The backbone of tournament play.",
    stats: [
      { label: "PULL RATE", value: "~25% of pulls" },
      { label: "BUY RANGE", value: "£0.30 – £2" },
      { label: "NOTABLE", value: "Haunter · Machoke · Ivysaur" },
    ],
    bg: "bg-wave",
    tint: "text-ink",
    chipBg: "bg-wave",
  },
  {
    label: "RARE",
    blurb:
      "Black-star rares. Every booster has one — Stage-2 Pokémon and signature trainers.",
    stats: [
      { label: "PULL RATE", value: "1 guaranteed per pack" },
      { label: "BUY RANGE", value: "£2 – £25" },
      { label: "NOTABLE", value: "Beedrill · Dragonair · Hitmonlee" },
    ],
    bg: "bg-sun",
    tint: "text-ink",
    chipBg: "bg-sun",
  },
  {
    label: "RARE HOLO",
    blurb:
      "Foil fronts, chase-card energy. The look everyone remembers from the schoolyard.",
    stats: [
      { label: "PULL RATE", value: "~1 in 3 packs" },
      { label: "BUY RANGE", value: "£30 – £1000+" },
      { label: "NOTABLE", value: "Charizard · Blastoise · Mewtwo" },
    ],
    bg: "bg-ocean",
    tint: "text-ink",
    chipBg: "bg-ocean",
  },
  {
    label: "PROMO / CHASE",
    blurb:
      "Out-of-set legends — event exclusives, movie promos, first-editions. Hunted forever.",
    stats: [
      { label: "PULL RATE", value: "Event-only" },
      { label: "BUY RANGE", value: "£80 – £10,000+" },
      { label: "NOTABLE", value: "Ivy Pikachu · Mew · No.1 Trainer" },
    ],
    bg: "bg-ink",
    tint: "text-ocean",
    chipBg: "bg-ink",
  },
];

type Props = {
  /** One card per tier, in the same order as `tiers`. */
  cards: Card[];
  /** Defaults to the rarity ladder. Should be the same length as `cards`. */
  tiers?: ReelTier[];
  /** Chip in the header strip. */
  eyebrow?: string;
  /** Pill label above the tier name. */
  tierLabel?: string;
  /** Screen-reader description of the whole section. */
  ariaLabel?: string;
  /** Rendered above the pinned stage, inside the section. */
  intro?: React.ReactNode;
};

/**
 * Scroll-driven card reel. Pins a sticky stage while the page scrolls
 * through it, progressing an active index across the supplied tiers.
 *
 * Layout:
 *   • Mobile — card stage centered, big wordmark + blurb below.
 *   • Desktop (≥md) — card stage on the left, detail panel on the
 *     right with wordmark, blurb, and the tier's stat pairs.
 *
 * Each card's transform is interpolated from its distance to the active
 * index. The active card also receives `.card-3d-engaged` so holo shimmer
 * + sparkles trigger without hover — crucial on touch devices.
 *
 * Tier copy is applied imperatively (textContent / classList) rather
 * than through React state: the handler runs on every scroll frame, and
 * a setState per frame would re-render the entire card stage.
 */
export function HeroCardReel({
  cards,
  tiers = RARITY_TIERS,
  eyebrow = "The rarity ladder",
  tierLabel = "RARITY TIER",
  ariaLabel = "Rarity showcase: scroll to rise from common to chase cards",
  intro,
}: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const stageBgRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Refs for per-tier copy (both mobile-below and desktop-right share these).
  const labelRefs = useRef<(HTMLElement | null)[]>([]);
  const blurbRefs = useRef<(HTMLElement | null)[]>([]);
  const statValueRefs = useRef<(HTMLElement | null)[]>([]);
  const statLabelRefs = useRef<(HTMLElement | null)[]>([]);
  const tierIndexRef = useRef<HTMLElement | null>(null);
  const tierChipRef = useRef<HTMLElement | null>(null);

  const lastTierRef = useRef<number>(-1);

  // The handler reads tiers on every frame. Holding them in a ref keeps
  // the listener stable without naming `tiers` as a dependency — callers
  // pass an inline array, which would otherwise tear down and rebuild
  // the scroll listener on every parent render. The sync happens in an
  // effect rather than during render (React 19 forbids the latter); the
  // initial value is already correct, so the first frame isn't affected.
  const tiersRef = useRef(tiers);
  useEffect(() => {
    tiersRef.current = tiers;
  }, [tiers]);

  const tierCount = tiers.length;
  const cardCount = cards.length;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    let queued = false;

    const update = () => {
      queued = false;
      const activeTiers = tiersRef.current;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = Math.max(1, rect.height - vh);
      const scrolled = Math.max(0, -rect.top);
      const p = Math.min(1, Math.max(0, scrolled / total));

      const n = cardCount;
      const activeIdx = p * (n - 1);
      const activeI = Math.min(n - 1, Math.round(activeIdx));

      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        const offset = i - activeIdx;
        const abs = Math.abs(offset);
        const tx = offset * 58;
        const rotY = -offset * 14;
        const rotZ = offset * -2.4;
        const scale = Math.max(0.55, 1.12 - abs * 0.2);
        const opacity = Math.max(0.16, 1 - abs * 0.42);
        const z = 1000 - Math.round(abs * 100);
        el.style.transform =
          `translate(-50%, -50%) translateX(${tx.toFixed(2)}%) ` +
          `rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) ` +
          `scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(z);

        const inner = el.querySelector<HTMLElement>(".card-3d");
        if (inner) {
          if (i === activeI) inner.classList.add("card-3d-engaged");
          else inner.classList.remove("card-3d-engaged");
          if (i === activeI) {
            const scrollMix = p * (n - 1) - activeI;
            inner.style.setProperty("--rx", `${(scrollMix * 14).toFixed(2)}deg`);
            inner.style.setProperty("--ry", `${(-scrollMix * 18).toFixed(2)}deg`);
            inner.style.setProperty("--lift", `28px`);
            inner.style.setProperty("--scale", `1.04`);
          } else {
            inner.style.setProperty("--rx", `0deg`);
            inner.style.setProperty("--ry", `0deg`);
            inner.style.setProperty("--lift", `0px`);
            inner.style.setProperty("--scale", `1`);
          }
        }
      });

      const bar = progressBarRef.current;
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;

      if (activeI !== lastTierRef.current) {
        lastTierRef.current = activeI;
        const tier = activeTiers[Math.min(activeI, activeTiers.length - 1)];
        if (!tier) return;

        // Wordmark tint swap on both mobile + desktop wordmarks.
        labelRefs.current.forEach((el) => {
          if (!el) return;
          el.textContent = tier.label;
          LABEL_TINT_CLASSES.forEach((c) => el.classList.remove(c));
          el.classList.add(tier.tint);
        });
        blurbRefs.current.forEach((el) => {
          if (!el) return;
          el.textContent = tier.blurb;
        });

        // Stat slots are fixed at the max across all tiers. Any slot
        // this tier doesn't fill is blanked and hidden, otherwise the
        // previous tier's value would linger on screen.
        statValueRefs.current.forEach((el, i) => {
          if (!el) return;
          const stat = tier.stats[i];
          const labelEl = statLabelRefs.current[i];
          const wrapper = el.parentElement;
          if (stat) {
            el.textContent = stat.value;
            if (labelEl) labelEl.textContent = stat.label;
            if (wrapper) wrapper.style.display = "";
          } else {
            el.textContent = "";
            if (labelEl) labelEl.textContent = "";
            if (wrapper) wrapper.style.display = "none";
          }
        });

        if (tierIndexRef.current) {
          tierIndexRef.current.textContent = `${activeI + 1} / ${activeTiers.length}`;
        }
        if (tierChipRef.current) {
          STAGE_BG_CLASSES.forEach((c) =>
            tierChipRef.current?.classList.remove(c),
          );
          tierChipRef.current.classList.add(tier.chipBg);
          // Flip the chip's text colour against a dark chip.
          if (tier.chipBg === "bg-ink") tierChipRef.current.classList.add("text-sun");
          else tierChipRef.current.classList.remove("text-sun");
        }

        const stageBg = stageBgRef.current;
        if (stageBg) {
          STAGE_BG_CLASSES.forEach((c) => stageBg.classList.remove(c));
          stageBg.classList.add(tier.bg);
        }
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
  }, [cardCount]);

  const tier0 = tiers[0];
  // Fixed slot count so the imperative updater always has a target,
  // even for tiers declaring fewer stats than their neighbours.
  const statSlots = Math.max(1, ...tiers.map((t) => t.stats.length));

  if (!tier0 || cardCount === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative bg-paper px-5 sm:px-10 md:px-14 lg:px-24 py-6 md:py-10"
      style={{ height: `min(260vh, calc(70vh + ${tierCount} * 38vh))` }}
      aria-label={ariaLabel}
    >
      {intro ? <div className="mb-6 md:mb-8">{intro}</div> : null}
      <div className="sticky top-[15vh] h-[70vh] overflow-hidden flex flex-col rounded-xl border-[3px] border-ink bg-paper-strong">
        {/* Tier-tinted backdrop */}
        <div
          ref={stageBgRef}
          className="absolute inset-0 bg-paper-strong transition-colors duration-500 ease-out"
          aria-hidden="true"
        />

        {/* Right-column wash. Lives outside the grid so it spans the
            full height of the sticky (including the header strip) —
            otherwise the tier-tinted backdrop pokes through above the
            aside. Desktop only.

            Kept near-opaque: the panel's body copy is `text-secondary`
            and its stat labels are `text-muted`, both of which are dark
            browns that vanish against the `bg-ink` tier at a lighter
            wash. The tier colour still reads through as a tint. */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-0 bottom-0 right-0 bg-paper-strong/88 backdrop-blur-[1px] pointer-events-none"
          style={{ left: "calc(1.15 / 2 * 100%)" }}
        />

        {/* Vertical divider that runs the full height of the sticky, so
            the rule between stage + aside reads as one continuous line
            rather than only appearing below the header. */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-0 bottom-0 w-[3px] bg-ink pointer-events-none z-[5]"
          style={{ left: "calc(1.15 / 2 * 100%)" }}
        />

        {/* Header strip */}
        <div className="relative z-10 flex items-center justify-between px-4 md:px-6 pt-3 md:pt-4">
          <span className="font-display text-[10px] tracking-widest text-ink bg-sun border-2 border-ink px-2 py-1 rounded-sm">
            {eyebrow}
          </span>
          <span className="font-display text-[10px] tracking-widest text-muted hidden sm:block">
            Scroll ↓
          </span>
        </div>

        {/* Main content — two-up on md+, stacked on mobile */}
        <div className="relative flex-1 grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] min-h-0">
          {/* Card stage */}
          <div className="relative [perspective:1200px] min-h-0">
            {cards.map((card, i) => (
              <div
                key={`${card.id}-${i}`}
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="absolute top-1/2 left-1/2 will-change-transform pointer-events-auto"
                style={{
                  transform: "translate(-50%, -50%)",
                  transition:
                    "transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 140ms linear",
                }}
              >
                <CardImage
                  src={card.images.large}
                  alt={card.name}
                  size="md"
                  rarity={card.rarity}
                />
                <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 whitespace-nowrap">
                  <span className="font-display text-[9px] tracking-widest bg-ink text-paper-strong px-1.5 py-0.5 rounded-sm border border-ink">
                    {(card.rarity ?? "Promo").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP info panel — hidden on mobile. */}
          <aside className="hidden md:flex relative flex-col justify-center gap-4 px-6 lg:px-10 py-6">
            <div className="flex items-center gap-2">
              <span
                ref={tierChipRef}
                className="font-display text-[10px] tracking-widest border-2 border-ink px-2 py-1 rounded-sm bg-paper-strong"
              >
                {tierLabel}
              </span>
              <span
                ref={tierIndexRef}
                className="font-display text-[10px] tracking-widest text-muted tabular-nums"
              >
                1 / {tierCount}
              </span>
            </div>

            <h2 className="font-display leading-[0.9] tracking-tight break-words text-[clamp(32px,_4.5vw,_64px)]">
              <span
                ref={(el) => {
                  labelRefs.current[0] = el;
                }}
                className={`hero-label-strong ${tier0.tint} transition-colors duration-500 ease-out`}
              >
                {tier0.label}
              </span>
            </h2>

            <p
              ref={(el) => {
                blurbRefs.current[0] = el;
              }}
              className="text-[13px] lg:text-[14px] text-secondary max-w-[38ch]"
            >
              {tier0.blurb}
            </p>

            <dl className="grid grid-cols-2 gap-3 pt-2 border-t-2 border-ink/15">
              {Array.from({ length: statSlots }).map((_, i) => {
                const stat = tier0.stats[i];
                return (
                  <div
                    key={i}
                    className={`flex flex-col gap-0.5 ${i >= 2 ? "col-span-2" : ""}`}
                    style={stat ? undefined : { display: "none" }}
                  >
                    <dt
                      ref={(el) => {
                        statLabelRefs.current[i] = el;
                      }}
                      className="font-display text-[9px] tracking-widest text-muted"
                    >
                      {stat?.label ?? ""}
                    </dt>
                    <dd
                      ref={(el) => {
                        statValueRefs.current[i] = el;
                      }}
                      className="font-display text-[13px] tracking-tight text-ink tabular-nums"
                    >
                      {stat?.value ?? ""}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </aside>
        </div>

        {/* MOBILE wordmark + blurb — hidden on md+ since the panel covers
            it. Sits on its own near-opaque plate for the same contrast
            reason as the desktop wash: without it, the dark body copy is
            unreadable on the `bg-ink` tier. */}
        <div className="md:hidden relative z-10 flex flex-col items-center gap-1 px-4 pt-3 pb-4 text-center bg-paper-strong/88 backdrop-blur-[1px]">
          <span className="font-display text-[9px] tracking-widest text-muted">
            {tierLabel}
          </span>
          <h2 className="font-display leading-none tracking-tight text-[24px] sm:text-[32px]">
            <span
              ref={(el) => {
                labelRefs.current[1] = el;
              }}
              className={`hero-label-strong ${tier0.tint} transition-colors duration-500 ease-out`}
            >
              {tier0.label}
            </span>
          </h2>
          <p
            ref={(el) => {
              blurbRefs.current[1] = el;
            }}
            className="text-[12px] text-secondary max-w-[48ch] mx-auto"
          >
            {tier0.blurb}
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 h-[4px] bg-ink/10">
          <div
            ref={progressBarRef}
            className="absolute inset-0 bg-ocean origin-left"
            style={{ transform: "scaleX(0)" }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
