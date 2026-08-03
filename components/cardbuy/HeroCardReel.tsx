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
const LABEL_TINT_CLASSES = ["text-ink", "text-ocean"] as const;

/** Card fan spread (% of card width per step), by breakpoint. */
function spreadFor(vw: number): number {
  if (vw < 480) return 30;
  if (vw < 768) return 40;
  if (vw < 1280) return 50;
  return 58;
}

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
    bg: "bg-wave",
    tint: "text-ink",
    chipBg: "bg-wave",
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
    bg: "bg-ocean",
    tint: "text-ocean",
    chipBg: "bg-ocean",
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
    tint: "text-ocean",
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
    tint: "text-ink",
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
 *   • Mobile — card stage on top, copy + stats stacked below on a plate.
 *   • Desktop (≥md) — card stage on the left, detail panel on the right
 *     with its content distributed top-to-bottom rather than clustered
 *     in the middle, so a tall stage doesn't read as mostly empty.
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
  const pinRangeRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const stageBgRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Per-tier copy targets. Each array holds the desktop node at [0] and
  // the mobile node at [1] — both panels show the same tier, so the
  // handler writes through the whole array rather than duplicating logic.
  const labelRefs = useRef<(HTMLElement | null)[]>([]);
  const blurbRefs = useRef<(HTMLElement | null)[]>([]);
  const tierIndexRefs = useRef<(HTMLElement | null)[]>([]);
  const tierChipRefs = useRef<(HTMLElement | null)[]>([]);
  // Stat slots, keyed `${panel}-${slot}` so desktop and mobile can be
  // updated in one pass without two parallel ref structures.
  const statValueRefs = useRef<Record<string, HTMLElement | null>>({});
  const statLabelRefs = useRef<Record<string, HTMLElement | null>>({});

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
  // Fixed slot count so the imperative updater always has a target, even
  // for tiers declaring fewer stats than their neighbours.
  const statSlots = Math.max(1, ...tiers.map((t) => t.stats.length));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    let queued = false;

    const update = () => {
      queued = false;
      const activeTiers = tiersRef.current;
      const vh = window.innerHeight || 1;

      // Progress is measured over the range the stage is actually
      // PINNED for, not over the whole section — the `intro` block sits
      // above the stage (and is a different height on each page that
      // uses this component), and the stage is shorter than the
      // viewport, so it unpins before the section ends.
      //
      // `pinRangeRef` is the stage's non-sticky parent, which is what
      // makes this measurable: a sticky element's own `offsetTop` grows
      // as it sticks, so reading the offset off the stage itself feeds
      // its own output back into the input and squashes the range.
      const sticky = stickyRef.current;
      const range = pinRangeRef.current;
      if (!range) return;
      const rangeRect = range.getBoundingClientRect();
      const stickyH = sticky?.offsetHeight ?? vh;
      const pinTop = sticky ? parseFloat(getComputedStyle(sticky).top) || 0 : 0;
      const travel = Math.max(1, rangeRect.height - stickyH);
      const p = Math.min(1, Math.max(0, (pinTop - rangeRect.top) / travel));

      const n = cardCount;
      const activeIdx = p * (n - 1);
      const activeI = Math.min(n - 1, Math.round(activeIdx));
      const spread = spreadFor(window.innerWidth || 1024);

      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        const offset = i - activeIdx;
        const abs = Math.abs(offset);
        const tx = offset * spread;
        const rotY = -offset * 14;
        const rotZ = offset * -2.4;
        // Gentler scale + opacity falloff than the original: the
        // neighbouring cards have to stay legible, otherwise the "fan"
        // reads as a single floating card — especially on mobile, where
        // the stage is narrow and only ±1 neighbour is ever on screen.
        const scale = Math.max(0.66, 1.1 - abs * 0.15);
        const opacity = Math.max(0.3, 1 - abs * 0.32);
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
        tierIndexRefs.current.forEach((el) => {
          if (!el) return;
          el.textContent = `${activeI + 1} / ${activeTiers.length}`;
        });
        tierChipRefs.current.forEach((el) => {
          if (!el) return;
          STAGE_BG_CLASSES.forEach((c) => el.classList.remove(c));
          el.classList.add(tier.chipBg);
          // Flip the chip's text colour against a dark chip.
          if (tier.chipBg === "bg-ink") el.classList.add("text-sun");
          else el.classList.remove("text-sun");
        });

        // Any slot this tier doesn't fill is blanked and hidden —
        // otherwise the previous tier's value lingers on screen.
        for (const panel of ["d", "m"] as const) {
          for (let i = 0; i < statSlots; i++) {
            const key = `${panel}-${i}`;
            const valueEl = statValueRefs.current[key];
            if (!valueEl) continue;
            const labelEl = statLabelRefs.current[key];
            const stat = tier.stats[i];
            const wrapper = valueEl.parentElement;
            if (stat) {
              valueEl.textContent = stat.value;
              if (labelEl) labelEl.textContent = stat.label;
              if (wrapper) wrapper.style.display = "";
            } else {
              valueEl.textContent = "";
              if (labelEl) labelEl.textContent = "";
              if (wrapper) wrapper.style.display = "none";
            }
          }
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
  }, [cardCount, statSlots]);

  const tier0 = tiers[0];
  if (!tier0 || cardCount === 0) return null;

  /** Stat grid, shared by both panels. `panel` keys the ref registry. */
  const statGrid = (panel: "d" | "m") => (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
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
                statLabelRefs.current[`${panel}-${i}`] = el;
              }}
              className="font-display text-[9px] tracking-widest text-muted"
            >
              {stat?.label ?? ""}
            </dt>
            <dd
              ref={(el) => {
                statValueRefs.current[`${panel}-${i}`] = el;
              }}
              className="font-display text-[12px] md:text-[13px] tracking-tight text-ink tabular-nums"
            >
              {stat?.value ?? ""}
            </dd>
          </div>
        );
      })}
    </dl>
  );

  /** Tier pill + counter, shared by both panels. */
  const tierChip = (panel: 0 | 1) => (
    <div className="flex items-center gap-2">
      <span
        ref={(el) => {
          tierChipRefs.current[panel] = el;
        }}
        className={`font-display text-[10px] tracking-widest border-2 border-ink px-2 py-1 rounded-sm ${tier0.chipBg}`}
      >
        {tierLabel}
      </span>
      <span
        ref={(el) => {
          tierIndexRefs.current[panel] = el;
        }}
        className="font-display text-[10px] tracking-widest text-muted tabular-nums"
      >
        1 / {tierCount}
      </span>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="relative bg-paper px-4 sm:px-6 md:px-8 py-6 md:py-10"
      style={{ height: `min(240vh, calc(70vh + ${tierCount} * 32vh))` }}
      aria-label={ariaLabel}
    >
      {/* Matches the max-width every other section on the page uses —
          without it the stage stretched to the full viewport on wide
          screens while the copy around it stayed capped, which left the
          card fan marooned in the middle of a very empty box.

          `h-full` is load-bearing: a sticky child can only stick within
          its parent's box, so an auto-height wrapper would collapse to
          the stage's own height and the pin would end immediately. */}
      <div className="max-w-[1300px] mx-auto h-full flex flex-col">
        {intro ? <div className="mb-6 md:mb-8">{intro}</div> : null}

        {/* Non-sticky pin range. Owns the scroll distance the stage is
            pinned across, and is what the progress math measures — see
            the note in the scroll handler. */}
        <div ref={pinRangeRef} className="flex-1 min-h-0">
        <div
          ref={stickyRef}
          className="sticky top-[12vh] h-[72vh] max-h-[580px] overflow-hidden flex flex-col rounded-xl border-[3px] border-ink bg-paper-strong"
        >
          {/* Tier-tinted backdrop */}
          <div
            ref={stageBgRef}
            className={`absolute inset-0 ${tier0.bg} transition-colors duration-500 ease-out`}
            aria-hidden="true"
          />

          {/* Binder-pocket grid. The section is "the singles wall", so the
              space behind the fan reads as a wall of pockets rather than
              as dead area. Cells are card-proportioned (2.5:3.5). */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-ink) 2px, transparent 2px)," +
                "linear-gradient(to bottom, var(--color-ink) 2px, transparent 2px)",
              backgroundSize: "76px 106px",
            }}
          />
          {/* Second pass in paper. The ink grid disappears against the
              `bg-ink` tier, and a light grid disappears against the pale
              ones — layering both means the wall stays legible on every
              tier without the handler having to swap it. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.10] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-paper-strong) 2px, transparent 2px)," +
                "linear-gradient(to bottom, var(--color-paper-strong) 2px, transparent 2px)",
              backgroundSize: "76px 106px",
            }}
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
            className="hidden lg:block absolute top-0 bottom-0 right-0 bg-paper-strong/88 backdrop-blur-[1px] pointer-events-none"
            style={{ left: "calc(1.1 / 2 * 100%)" }}
          />

          {/* Vertical divider that runs the full height of the sticky, so
              the rule between stage + aside reads as one continuous line
              rather than only appearing below the header. */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-0 bottom-0 w-[3px] bg-ink pointer-events-none z-[5]"
            style={{ left: "calc(1.1 / 2 * 100%)" }}
          />

          {/* Header strip */}
          <div className="relative z-10 flex items-center justify-between px-4 md:px-6 pt-3 md:pt-4">
            <span className="font-display text-[10px] tracking-widest text-ink bg-sun border-2 border-ink px-2 py-1 rounded-sm">
              {eyebrow}
            </span>
            <span className="font-display text-[10px] tracking-widest text-ink/60 hidden sm:block">
              Scroll ↓
            </span>
          </div>

          {/* Main content — two-up on md+, stacked on mobile */}
          <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] min-h-0">
            {/* Card stage. The inner wrapper scales the whole fan so one
                card size serves every breakpoint — the cards themselves
                are absolutely positioned, so scaling their container is
                cheaper than swapping `size` and re-fetching images. */}
            <div className="relative [perspective:1200px] min-h-0 overflow-hidden">
              {/* Below lg the layout is stacked, so the stage's HEIGHT is
                  the binding constraint; from lg it splits two-up and the
                  stage's WIDTH binds instead — hence the step down at lg
                  before climbing again on wider screens. */}
              <div className="absolute inset-0 origin-center -translate-y-[3%] scale-[0.58] sm:scale-[0.64] md:scale-[0.68] lg:translate-y-0 lg:scale-[0.76] xl:scale-[0.9] 2xl:scale-100">
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
                      size="lg"
                      rarity={card.rarity}
                    />
                    <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 whitespace-nowrap">
                      <span className="font-display text-[11px] tracking-widest bg-ink text-paper-strong px-2 py-1 rounded-sm border-2 border-ink">
                        {(card.rarity ?? "Promo").toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP (lg+) info panel — content distributed top-to-bottom so a
                tall stage doesn't leave it floating in the middle. */}
            <aside className="hidden lg:flex relative flex-col justify-between gap-5 px-6 lg:px-9 py-6 lg:py-8">
              {tierChip(0)}

              <div className="flex flex-col gap-3">
                <h2 className="font-display leading-[0.88] tracking-tight break-words text-[clamp(34px,_4vw,_60px)]">
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
                  className="text-[13px] lg:text-[15px] leading-relaxed text-secondary max-w-[40ch]"
                >
                  {tier0.blurb}
                </p>
              </div>

              <div className="pt-4 border-t-2 border-ink/15">{statGrid("d")}</div>
            </aside>
          </div>

          {/* STACKED panel — mobile and tablet. Hidden on lg+ where the aside
              takes over. Sits
              on its own near-opaque plate for the same contrast reason as
              the desktop wash, and now carries the tier counter and stats
              that were previously desktop-only. */}
          <div className="lg:hidden relative z-10 flex flex-col gap-2.5 px-4 pt-3 pb-4 bg-paper-strong/90 backdrop-blur-[1px] border-t-[3px] border-ink">
            {tierChip(1)}
            <h2 className="font-display leading-none tracking-tight text-[30px] sm:text-[36px]">
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
              className="text-[13px] leading-snug text-secondary"
            >
              {tier0.blurb}
            </p>
            <div className="pt-2.5 border-t-2 border-ink/15">{statGrid("m")}</div>
          </div>

          {/* Progress bar */}
          <div className="relative z-10 h-[5px] bg-ink/10">
            <div
              ref={progressBarRef}
              className="absolute inset-0 bg-ocean origin-left"
              style={{ transform: "scaleX(0)" }}
              aria-hidden="true"
            />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
