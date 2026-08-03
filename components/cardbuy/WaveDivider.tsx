/**
 * Aqua TCG wave motif — a full-bleed decorative crest used at section
 * seams (header base, hero→content, footer top). Purpose-built path,
 * not lifted from the logo (the logo is a mark, not a tileable strip).
 *
 * The path fills everything BELOW the crest, so the band reads as the
 * `fill` colour rising into whatever sits above it. `flip` mirrors it
 * vertically for a top-edge crest (e.g. the footer).
 *
 * Decorative only — `aria-hidden`, no pointer surface.
 */
/**
 * The crest path itself, on a `0 0 1200 40` viewBox.
 *
 * Exported so callers that need the motif at a size this component can't
 * express — a crest stack scaled as a percentage of its parent, say — can
 * draw it without forking the shape. `WaveDivider` remains the right choice
 * for the ordinary fixed-height section seam.
 */
export const WAVE_PATH =
  "M0,18 C150,38 280,2 440,16 C600,30 740,40 900,22 C1040,6 1140,14 1200,20 L1200,40 L0,40 Z";

export function WaveDivider({
  fill = "var(--color-ocean)",
  height = 24,
  flip = false,
  className = "",
}: {
  fill?: string;
  height?: number;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden leading-[0] pointer-events-none ${flip ? "rotate-180" : ""} ${className}`.trim()}
      style={{ height }}
    >
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height }}
      >
        <path d={WAVE_PATH} fill={fill} />
      </svg>
    </div>
  );
}
