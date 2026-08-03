import type { Metadata } from "next";
import { HeroLockup } from "@/components/marketing/HeroLockup";
import { TradeTriptych } from "@/components/marketing/TradeTriptych";
import { StockGrid } from "@/components/marketing/StockGrid";
import { ShopBand } from "@/components/marketing/ShopBand";
import { StoryPanel } from "@/components/marketing/StoryPanel";
import { VisitPanel } from "@/components/marketing/VisitPanel";
import { ContactPanel } from "@/components/marketing/ContactPanel";
import { HeroCardReel, type ReelTier } from "@/components/cardbuy/HeroCardReel";
import { getSiteContent } from "@/lib/marketing/queries";
import { getCardById, getSetById, getCardCount } from "@/lib/fixtures/cards";
import type { Card } from "@/lib/types/card";

export const metadata: Metadata = {
  title: "Aqua TCG · Pokémon cards, graded cards & collectibles",
  description:
    "Aqua TCG buys, sells and trades Pokémon cards, graded cards and collectibles for collectors across the North East and the UK. Find us at the Metrocentre, Gateshead.",
  alternates: { canonical: "/" },
};

/**
 * Cards fanned through the singles-wall reel, one per tier. Ordered to
 * walk from everyday singles up to the chase cards.
 */
const WALL_CARD_IDS = [
  "base1-58", // Pikachu
  "base1-29", // Haunter
  "base1-17", // Beedrill
  "base1-4", // Charizard
  "basep-8", // Mew
] as const;

/** Booster wrapper used decoratively in the "sealed" stock panel. */
const SEALED_SET_IDS = ["swsh12pt5", "sv1", "base1", "neo1"] as const;

/**
 * Tiers for the singles-wall reel.
 *
 * Copy sticks to what Aqua TCG says about its own stock — 1,000+ singles
 * changing daily, vintage through modern, English and Japanese, graded
 * through PSA and ACE. No invented figures.
 */
const WALL_TIERS: ReelTier[] = [
  {
    label: "VINTAGE",
    blurb:
      "The cards people come in asking for by name. WOTC-era holos, first editions and the ones that were in everybody's schoolbag.",
    stats: [
      { label: "ON THE WALL", value: "Always stocked" },
      { label: "CONDITION", value: "Raw & graded" },
    ],
    bg: "bg-wave",
    tint: "text-ink",
    chipBg: "bg-wave",
  },
  {
    label: "MODERN",
    blurb:
      "Current sets, pulled and traded in daily. If it released recently, there is a good chance it is already behind the counter.",
    stats: [
      { label: "RESTOCKED", value: "Daily from trades" },
      { label: "SETS", value: "Current & recent" },
    ],
    bg: "bg-ocean",
    tint: "text-ocean",
    chipBg: "bg-ocean",
  },
  {
    label: "JAPANESE",
    blurb:
      "Japanese singles sit alongside the English wall — different art treatments, different print runs, same shelf.",
    stats: [
      { label: "LANGUAGES", value: "English & Japanese" },
      { label: "FORMAT", value: "Singles" },
    ],
    bg: "bg-sun",
    tint: "text-ink",
    chipBg: "bg-sun",
  },
  {
    label: "GRADED",
    blurb:
      "Professionally graded slabs from PSA and ACE. Browse ours, or bring yours in and we will price it against live comparables.",
    stats: [
      { label: "GRADERS", value: "PSA · ACE" },
      { label: "WE ALSO", value: "Buy your slabs" },
    ],
    bg: "bg-wave",
    tint: "text-ocean",
    chipBg: "bg-wave",
  },
  {
    label: "THE CHASE",
    blurb:
      "The wall changes every single day, so the headline card is never the same twice. That is rather the point of coming in.",
    stats: [
      { label: "TURNOVER", value: "Changes daily" },
      { label: "SOURCE", value: "New trades & buys" },
    ],
    bg: "bg-ink",
    tint: "text-ocean",
    chipBg: "bg-ink",
  },
];

export default async function MarketingHomePage() {
  const content = await getSiteContent();

  const wallCards = WALL_CARD_IDS.map((id) => getCardById(id)).filter(
    (c): c is Card => Boolean(c),
  );
  // The reel pairs card N with tier N, so a missing fixture would shift
  // every label out of step. Trim the tiers to whatever actually resolved.
  const wallTiers = WALL_TIERS.slice(0, wallCards.length);

  const sealedSet = SEALED_SET_IDS.map((id) => getSetById(id)).find((s) => s);
  const sealedCount = sealedSet ? getCardCount(sealedSet.id) : 0;

  return (
    <div className="flex flex-col">
      <HeroLockup content={content} />

      <TradeTriptych content={content} />

      {/* THE SINGLES WALL — scroll-pinned 3D reel */}
      <div id="wall" className="scroll-mt-24 border-b-[3px] border-ink">
        {wallCards.length > 0 ? (
          <HeroCardReel
            cards={wallCards}
            tiers={wallTiers}
            eyebrow="The singles wall"
            tierLabel="ON THE WALL"
            ariaLabel="The singles wall: scroll through vintage, modern, Japanese, graded and chase cards"
            intro={
              <div className="max-w-[62ch] flex flex-col gap-3">
                <span className="bg-ocean text-paper-strong border-2 border-ink px-2 py-1 w-fit font-display text-[10px] tracking-wider rounded-sm">
                  The wall
                </span>
                <h2 className="font-display text-[30px] sm:text-[40px] md:text-[52px] leading-[0.95] tracking-tight">
                  Over a thousand singles. Different every day.
                </h2>
                <p className="text-[14px] md:text-[15px] text-secondary">
                  {content["wall.blurb"]}
                </p>
              </div>
            }
          />
        ) : null}
      </div>

      {/* The wall as 3D card art, then the wall as it actually is. */}
      <ShopBand content={content} />

      <StockGrid
        content={content}
        singles={wallCards.slice(0, 2)}
        graded={wallCards[3] ?? wallCards[0]}
        sealedSet={sealedSet}
        sealedCount={sealedCount}
      />

      <StoryPanel content={content} />

      <VisitPanel content={content} />

      <ContactPanel content={content} />
    </div>
  );
}
