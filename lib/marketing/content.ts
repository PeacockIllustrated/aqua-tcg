/**
 * Marketing copy for the public one-pager at `/`.
 *
 * This module is the SOURCE OF TRUTH for default copy. The
 * `lewis_site_content` table (migration 0014) only carries overrides:
 * a key with no row falls through to the default below. That ordering
 * matters — the site must render correctly with Supabase unreachable,
 * unmigrated, or empty, which is exactly the state a fresh clone is in.
 *
 * Every field is also the admin form's schema. `/admin/site` builds its
 * inputs from FIELDS, so adding a key here is the only step needed to
 * make a new string editable.
 *
 * PROVENANCE — the factual claims in these defaults were reconstructed
 * from Aqua TCG's own site copy (via search-index extracts) plus press
 * coverage of the Metrocentre opening. Fields marked `unverified` could
 * not be confirmed and render as blanks or are hidden until Lewis fills
 * them in; the admin screen flags them so they don't ship as guesses.
 */

export type FieldKind = "text" | "textarea" | "url" | "email";

export type ContentField = {
  key: string;
  label: string;
  help?: string;
  kind: FieldKind;
  group: string;
  /** Rendered whenever there is no DB override for this key. */
  value: string;
  /**
   * Set when the underlying fact couldn't be verified against the live
   * site. These default to empty and are surfaced in admin as "needs
   * checking" rather than being filled with a plausible guess.
   */
  unverified?: boolean;
};

export const GROUPS = [
  "Hero",
  "Buy · sell · trade",
  "The singles wall",
  "What we stock",
  "Our story",
  "Visit us",
  "Contact & social",
  "Footer",
] as const;

export type ContentGroup = (typeof GROUPS)[number];

export const FIELDS: ContentField[] = [
  // ---------------------------------------------------------------
  // Hero
  // ---------------------------------------------------------------
  {
    key: "hero.eyebrow",
    label: "Eyebrow chip",
    help: "Small all-caps chip above the wordmark.",
    kind: "text",
    group: "Hero",
    value: "Pokémon TCG · North East",
  },
  {
    key: "hero.tagline",
    label: "Tagline",
    help: "One line, sits directly under the AQUA TCG wordmark.",
    kind: "text",
    group: "Hero",
    value: "Pokémon cards, graded cards & collectibles.",
  },
  {
    key: "hero.body",
    label: "Hero paragraph",
    kind: "textarea",
    group: "Hero",
    value:
      "We buy, sell and trade for collectors across the North East and the whole of the UK — and we now have a permanent home at the Metrocentre.",
  },

  // ---------------------------------------------------------------
  // Buy · sell · trade
  // ---------------------------------------------------------------
  {
    key: "trade.intro",
    label: "Section intro",
    kind: "textarea",
    group: "Buy · sell · trade",
    value:
      "Three ways to deal with us, all priced against the latest eBay UK comparisons — so you can always see where the number came from.",
  },
  {
    key: "trade.buy_body",
    label: "“Buy” card copy",
    kind: "textarea",
    group: "Buy · sell · trade",
    value:
      "Singles, slabs, sealed and accessories, picked by people who actually collect. Ask us anything — we would rather talk you into the right card than the expensive one.",
  },
  {
    key: "trade.sell_body",
    label: "“Sell” card copy",
    kind: "textarea",
    group: "Buy · sell · trade",
    value:
      "Bring in a single card, a binder or a whole collection. We price it against live eBay UK data, show you the working, and make you an offer there and then.",
  },
  {
    key: "trade.trade_body",
    label: "“Trade” card copy",
    kind: "textarea",
    group: "Buy · sell · trade",
    value:
      "Trade what you are finished with against what you are chasing. The wall changes daily, so there is nearly always something new to put your credit towards.",
  },

  // ---------------------------------------------------------------
  // The singles wall
  // ---------------------------------------------------------------
  {
    key: "wall.blurb",
    label: "Singles wall blurb",
    kind: "textarea",
    group: "The singles wall",
    value:
      "Over 1,000 singles on the wall at any one time, and it changes daily as new trades come in. Vintage through to the newest releases, English and Japanese.",
  },

  // ---------------------------------------------------------------
  // What we stock
  // ---------------------------------------------------------------
  {
    key: "stock.intro",
    label: "Section intro",
    kind: "textarea",
    group: "What we stock",
    value:
      "Four things we always have in — plus whatever walked through the door this morning.",
  },
  {
    key: "stock.singles_body",
    label: "Singles copy",
    kind: "textarea",
    group: "What we stock",
    value:
      "1,000+ singles on the wall. Vintage to modern, English and Japanese, restocked daily from new trades.",
  },
  {
    key: "stock.graded_body",
    label: "Graded copy",
    kind: "textarea",
    group: "What we stock",
    value:
      "Professionally graded slabs from PSA and ACE. Browse ours, or bring yours in for a valuation.",
  },
  {
    key: "stock.sealed_body",
    label: "Sealed copy",
    kind: "textarea",
    group: "What we stock",
    value:
      "Booster boxes, Elite Trainer Boxes, bundles and single packs across current and recent sets.",
  },
  {
    key: "stock.accessories_body",
    label: "Accessories copy",
    kind: "textarea",
    group: "What we stock",
    value:
      "Sleeves, binders, deck boxes, storage and display pieces — everything needed to keep a collection safe.",
  },
  {
    key: "stock.other_tcgs",
    label: "Other TCGs",
    help: "Shown as a strip of chips. Separate each with a comma.",
    kind: "text",
    group: "What we stock",
    value: "One Piece, Disney Lorcana, Yu-Gi-Oh!",
  },

  // ---------------------------------------------------------------
  // Our story
  // ---------------------------------------------------------------
  {
    key: "story.body_1",
    label: "Story · paragraph 1",
    kind: "textarea",
    group: "Our story",
    value:
      "Aqua TCG started with two lifelong friends from Gateshead — James Leather and Lewis Millen — and a shared obsession with trading cards.",
  },
  {
    key: "story.body_2",
    label: "Story · paragraph 2",
    kind: "textarea",
    group: "Our story",
    value:
      "Since 2024 we have travelled the UK trading at card shows and conventions: meeting collectors, buying collections, and helping people find the cards they genuinely love. In July 2026 that turned into a shop of our own.",
  },
  {
    key: "story.body_3",
    label: "Story · paragraph 3",
    kind: "textarea",
    group: "Our story",
    value:
      "We are collectors first. That means fair pricing, honest advice and no pressure — whether you are spending £2 or £2,000.",
  },

  // ---------------------------------------------------------------
  // Visit us
  // ---------------------------------------------------------------
  {
    key: "visit.address_1",
    label: "Address line 1",
    kind: "text",
    group: "Visit us",
    value: "The Crescent, Upper Green Mall",
  },
  {
    key: "visit.address_2",
    label: "Address line 2",
    kind: "text",
    group: "Visit us",
    value: "Metrocentre, Gateshead",
  },
  {
    key: "visit.postcode",
    label: "Postcode",
    help: "Not confirmed from the live site — please fill this in.",
    kind: "text",
    group: "Visit us",
    value: "",
    unverified: true,
  },
  {
    key: "visit.hours",
    label: "Opening hours",
    help: "Not confirmed from the live site. One line per day; the block is hidden entirely while empty.",
    kind: "textarea",
    group: "Visit us",
    value: "",
    unverified: true,
  },
  {
    key: "visit.note",
    label: "Finding us",
    kind: "textarea",
    group: "Visit us",
    value:
      "We are in The Crescent — the Metrocentre's independent quarter, on the Upper Green Mall.",
  },

  // ---------------------------------------------------------------
  // Contact & social
  // ---------------------------------------------------------------
  {
    key: "contact.blurb",
    label: "Contact blurb",
    kind: "textarea",
    group: "Contact & social",
    value:
      "Selling a collection, chasing one specific card, or just after a second opinion? Send us a message — we aim to reply to every enquiry as quickly as we can.",
  },
  {
    key: "contact.email",
    label: "Contact email",
    help: "Not confirmed from the live site. The email button is hidden while this is empty.",
    kind: "email",
    group: "Contact & social",
    value: "",
    unverified: true,
  },
  {
    key: "contact.social_blurb",
    label: "Social blurb",
    kind: "textarea",
    group: "Contact & social",
    value:
      "Follow along for new stock, collection buys, convention dates and shop news.",
  },
  {
    key: "social.instagram",
    label: "Instagram URL",
    kind: "url",
    group: "Contact & social",
    value: "https://www.instagram.com/aquatcguk/",
  },
  {
    key: "social.youtube",
    label: "YouTube URL",
    kind: "url",
    group: "Contact & social",
    value: "https://www.youtube.com/@aqua_tcg",
  },
  {
    key: "social.facebook",
    label: "Facebook URL",
    help: "Not confirmed from the live site. The link is hidden while empty.",
    kind: "url",
    group: "Contact & social",
    value: "",
    unverified: true,
  },

  // ---------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------
  {
    key: "footer.tagline",
    label: "Footer tagline",
    kind: "text",
    group: "Footer",
    value: "Pokémon cards, graded cards & collectibles · North East, UK",
  },
];

/** Every content key, typed as a union for call-site safety. */
export type ContentKey = string;

/** Flat map of key → default value. */
export const DEFAULT_CONTENT: Record<string, string> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f.value]),
);

export const FIELD_BY_KEY: Record<string, ContentField> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f]),
);

/**
 * Merge DB overrides over the code defaults.
 *
 * An override only wins when it is a non-empty string. A blank row is
 * treated as "unset" so clearing a field in admin restores the default
 * rather than blanking the section — except for `unverified` fields,
 * whose default IS empty and which are meant to stay hidden until
 * filled.
 */
export function resolveContent(
  overrides: Record<string, string> | null | undefined,
): Record<string, string> {
  const merged = { ...DEFAULT_CONTENT };
  if (!overrides) return merged;
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    merged[key] = trimmed;
  }
  return merged;
}

/** Split a comma-separated content value into trimmed, non-empty parts. */
export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
