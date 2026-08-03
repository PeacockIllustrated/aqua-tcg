import Image from "next/image";
import { WaveDivider, WAVE_PATH } from "@/components/cardbuy/WaveDivider";
import type { ResolvedPhoto } from "@/lib/marketing/media";

/**
 * The house treatment for photography on the public page.
 *
 * Photographs of a shop are warm, cluttered and lit however the room was
 * lit; the brand is flat, high-contrast, three colours and a heavy outline.
 * Dropping raw photos into the page would read as a different site pasted
 * into this one. So every photo goes through the same treatment:
 *
 *   1. the pop-art frame — 3px ink outline and hard offset shadow, matching
 *      `.pop-static` on every other block;
 *   2. a duotone wash — `mix-blend-color` in ocean, which keeps the
 *      photograph's luminance (so faces and card art stay legible) while
 *      pulling its hue into the brand palette;
 *   3. the halftone dot grid used on the hero and story grounds, so the
 *      photo shares the page's texture;
 *   4. an optional wave seam along the bottom edge, in the ground colour of
 *      whatever sits below — the photo rises out of the section rather than
 *      being a rectangle dropped on top of it.
 *
 * With no photo supplied, the same frame renders a DESIGNED panel rather
 * than a gap or a broken image: wave crests, the dot grid and the slot's
 * title set in the display face. It is meant to look deliberate, because
 * until the client's photography arrives it is what the public sees.
 */
export function PhotoFrame({
  photo,
  /** Ground colour of the section below, for the bottom wave seam. */
  seamFill,
  /** Strength of the brand duotone. */
  tone = "full",
  /** Corner star badge, as used on the hero mark. */
  badge = false,
  /** Overlaid caption, bottom-left. */
  caption,
  priority = false,
  className = "",
  /**
   * `framed` is the default block treatment — rounded, outlined, offset
   * shadow. `bleed` is for full-width bands, where rounded corners and a
   * drop shadow against the viewport edge would look like a mistake; it
   * takes ink rules top and bottom instead, matching the section seams.
   */
  variant = "framed",
  /** Passed to `next/image`; defaults suit a half-width block. */
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  photo: ResolvedPhoto;
  seamFill?: string;
  tone?: "full" | "soft" | "none";
  badge?: boolean;
  caption?: string;
  priority?: boolean;
  className?: string;
  variant?: "framed" | "bleed";
  sizes?: string;
}) {
  const { slot, src, alt, external } = photo;

  const toneOpacity = tone === "full" ? 0.32 : tone === "soft" ? 0.16 : 0;

  const shell =
    variant === "bleed"
      ? "bg-ink border-y-[3px] border-ink overflow-hidden relative"
      : "pop-static bg-ink rounded-lg overflow-hidden relative";

  return (
    <figure className={`${shell} ${className}`.trim()}>
      <div className="relative w-full" style={{ aspectRatio: slot.aspect }}>
        {src ? (
          <>
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              unoptimized={external}
              className="object-cover"
            />
            {toneOpacity > 0 ? (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-ocean mix-blend-color pointer-events-none"
                style={{ opacity: toneOpacity }}
              />
            ) : null}
          </>
        ) : (
          <PlaceholderPanel slot={slot} />
        )}

        {/* Shared texture — sits over photo and placeholder alike. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(var(--color-ink) 1.5px, transparent 1.5px)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* Only over a real photograph. On the placeholder the caption
            would restate the title sitting directly above it, and its
            scrim would flatten the crests the panel is built from. */}
        {caption && src ? (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,10,10,0.72), transparent)",
              }}
            />
            <figcaption className="absolute left-3 bottom-3 md:left-4 md:bottom-4 z-[2] font-display text-[10px] md:text-[11px] tracking-widest text-paper-strong">
              {caption}
            </figcaption>
          </>
        ) : null}

        {seamFill ? (
          <WaveDivider
            fill={seamFill}
            height={22}
            className="absolute inset-x-0 bottom-0 z-[2]"
          />
        ) : null}
      </div>

      {badge ? (
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-[3] w-9 h-9 md:w-11 md:h-11 bg-sun border-[3px] border-ink rounded-full flex items-center justify-center rotate-12">
          <span className="font-display text-[12px] md:text-[14px] leading-none text-ink">
            ★
          </span>
        </div>
      ) : null}
    </figure>
  );
}

/**
 * What a slot shows before its photograph exists.
 *
 * Deliberately a graphic, not an error state — no camera glyph, no dashed
 * box, nothing that reads as broken to a member of the public.
 */
function PlaceholderPanel({
  slot,
}: {
  slot: ResolvedPhoto["slot"];
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-ocean overflow-hidden flex flex-col items-center justify-center gap-2 text-center px-4"
    >
      {/* Static sunburst, the hero's motif held still. It fills what would
          otherwise be a large flat field of ocean and makes the panel read
          as the same designed object as the hero.
          Rays in `wave`, not the hero's `sun`: gold at low alpha over ocean
          desaturates to a dirty olive, whereas the lighter blue reads as
          light through water and ties into the crests below. */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] aspect-square opacity-40"
        style={{
          background:
            "repeating-conic-gradient(from 0deg, var(--color-wave) 0deg 7deg, transparent 7deg 17deg)",
          WebkitMaskImage: "radial-gradient(circle, #000 12%, transparent 60%)",
          maskImage: "radial-gradient(circle, #000 12%, transparent 60%)",
        }}
      />

      {/* Crest stack, deepest at the back. Heights are a percentage of the
          panel rather than fixed pixels, so the motif reads the same at the
          4:5 portrait slot and the 21:9 band. */}
      <Crest heightPct={42} fill="var(--color-wave)" opacity={0.4} />
      <Crest heightPct={26} fill="var(--color-wave)" opacity={0.7} />
      <Crest heightPct={11} fill="var(--color-paper-strong)" />

      <span className="relative font-display text-[clamp(20px,4.6vw,44px)] leading-[0.95] tracking-tight text-paper-strong [text-shadow:3px_3px_0_var(--color-ink)]">
        {slot.placeholderTitle.toUpperCase()}
      </span>
      <span className="relative font-display text-[10px] md:text-[11px] tracking-widest text-ink bg-sun border-2 border-ink px-2 py-1 rounded-sm">
        {slot.placeholderNote}
      </span>
    </div>
  );
}

/** One crest of the placeholder's wave stack, sized as a % of the panel. */
function Crest({
  heightPct,
  fill,
  opacity = 1,
}: {
  heightPct: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className="absolute inset-x-0 bottom-0 w-full"
      style={{ height: `${heightPct}%`, opacity }}
    >
      <path d={WAVE_PATH} fill={fill} />
    </svg>
  );
}
