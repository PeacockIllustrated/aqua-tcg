import { CardImage } from "@/components/cardbuy/CardImage";
import { PackTile } from "@/components/cardbuy/PackTile";
import { splitList } from "@/lib/marketing/content";
import type { Card, CardSet } from "@/lib/types/card";

type Props = {
  content: Record<string, string>;
  /** Two cards fanned behind the "singles" panel. */
  singles: Card[];
  /** The card shown inside the mock slab. */
  graded?: Card;
  /** Booster wrapper for the "sealed" panel. Decorative — see below. */
  sealedSet?: CardSet;
  sealedCount: number;
};

/**
 * What Aqua TCG stocks, as four tactile panels.
 *
 * The 3D system does the heavy lifting here: singles get the tilt +
 * holo shimmer, sealed gets the full booster tear-open. The pack is
 * passed `href={null}` so opening it plays the animation and reseals
 * rather than routing into the buylist — the public site has no
 * platform routes.
 */
export function StockGrid({
  content,
  singles,
  graded,
  sealedSet,
  sealedCount,
}: Props) {
  const otherTcgs = splitList(content["stock.other_tcgs"] ?? "");

  return (
    <section
      id="stock"
      className="bg-paper scroll-mt-24 border-b-[3px] border-ink"
    >
      <div className="max-w-[1300px] mx-auto px-5 md:px-6 py-12 md:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-3 max-w-[62ch]">
          <span className="bg-sun text-ink border-2 border-ink px-2 py-1 w-fit font-display text-[10px] tracking-wider rounded-sm">
            What we stock
          </span>
          <h2 className="font-display text-[30px] sm:text-[40px] md:text-[52px] leading-[0.95] tracking-tight">
            Singles, slabs, sealed, sleeves.
          </h2>
          <p className="text-[14px] md:text-[15px] text-secondary">
            {content["stock.intro"]}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* SINGLES — a small fan of tiltable cards */}
          <StockPanel
            kicker="Singles"
            title="1,000+ on the wall"
            body={content["stock.singles_body"]}
            accent="bg-wave"
          >
            <div className="relative h-[190px] flex items-center justify-center">
              {singles.slice(0, 2).map((card, i) => (
                <div
                  key={card.id}
                  className="absolute"
                  style={{
                    transform: `rotate(${i === 0 ? -8 : 8}deg) translateX(${i === 0 ? -22 : 22}px)`,
                    zIndex: i,
                  }}
                >
                  <CardImage
                    src={card.images.large}
                    alt={card.name}
                    size="sm"
                    rarity={card.rarity}
                    interactive
                    hideBadge
                  />
                </div>
              ))}
            </div>
          </StockPanel>

          {/* GRADED — a card seated in a mock slab shell */}
          <StockPanel
            kicker="Graded"
            title="PSA & ACE slabs"
            body={content["stock.graded_body"]}
            accent="bg-ocean"
          >
            <div className="h-[190px] flex items-center justify-center">
              {graded ? (
                <div className="pop-static bg-paper-strong rounded-md p-1.5 pt-1 w-[112px]">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="font-display text-[7px] tracking-widest text-ink">
                      PSA
                    </span>
                    <span className="font-display text-[7px] tracking-widest text-ink tabular-nums">
                      MINT 9
                    </span>
                  </div>
                  <CardImage
                    src={graded.images.large}
                    alt={graded.name}
                    size="sm"
                    rarity={graded.rarity}
                    interactive
                    hideBadge
                  />
                </div>
              ) : null}
            </div>
          </StockPanel>

          {/* SEALED — the booster tear-open, purely decorative */}
          <StockPanel
            kicker="Sealed"
            title="Boxes, ETBs, packs"
            body={content["stock.sealed_body"]}
            accent="bg-sun"
          >
            <div className="h-[190px] flex items-center justify-center">
              {sealedSet ? (
                <div className="w-[112px]">
                  <PackTile
                    set={sealedSet}
                    cardCount={sealedCount}
                    href={null}
                    label="Open a booster pack — decorative animation"
                  />
                </div>
              ) : null}
            </div>
          </StockPanel>

          {/* ACCESSORIES */}
          <StockPanel
            kicker="Accessories"
            title="Keep it protected"
            body={content["stock.accessories_body"]}
            accent="bg-paper-strong"
          >
            <div className="h-[190px] flex items-center justify-center">
              <div className="relative w-[112px] h-[150px]">
                {["rotate-[-6deg]", "rotate-[3deg]", "rotate-[10deg]"].map(
                  (rot, i) => (
                    <div
                      key={rot}
                      className={`absolute inset-0 pop-static rounded-md ${rot} ${
                        ["bg-wave", "bg-paper-strong", "bg-sun"][i]
                      }`}
                      style={{ zIndex: i, transformOrigin: "50% 100%" }}
                      aria-hidden="true"
                    />
                  ),
                )}
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                  <span className="font-display text-[11px] tracking-widest text-ink bg-paper-strong border-[3px] border-ink px-2 py-1 rounded-sm rotate-[-4deg]">
                    SLEEVED
                  </span>
                </div>
              </div>
            </div>
          </StockPanel>
        </div>

        {otherTcgs.length > 0 ? (
          <div className="pop-card rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="font-display text-[11px] tracking-widest text-muted shrink-0">
              NOT JUST POKÉMON
            </span>
            <div className="flex flex-wrap gap-2">
              {otherTcgs.map((name) => (
                <span
                  key={name}
                  className="font-display text-[11px] tracking-wider bg-paper border-2 border-ink px-2.5 py-1 rounded-sm"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StockPanel({
  kicker,
  title,
  body,
  accent,
  children,
}: {
  kicker: string;
  title: string;
  body?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pop-card rounded-lg overflow-hidden flex flex-col">
      <div
        className={`${accent} border-b-[3px] border-ink px-4 py-2 flex items-center justify-between`}
      >
        <span className="font-display text-[10px] tracking-widest text-ink">
          {kicker}
        </span>
      </div>
      <div className="px-4 pt-4">{children}</div>
      <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
        <h3 className="font-display text-[18px] leading-tight tracking-tight">
          {title}
        </h3>
        <p className="text-[13px] text-secondary">{body}</p>
      </div>
    </div>
  );
}
