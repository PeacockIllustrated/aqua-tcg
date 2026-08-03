/**
 * Photography slots for the public one-pager.
 *
 * A "slot" is a named place on the page where a real photograph belongs —
 * the shopfront, the singles wall, the founders, the counter. Each slot's
 * source lives in `lib/marketing/content.ts` as an ordinary content field,
 * which means it is editable at `/admin/site` and stored as an override in
 * `lewis_site_content` exactly like every other string on the page.
 *
 * WHY CONTENT-DRIVEN RATHER THAN FILES ON DISK
 *
 * Following §07's principle that every decision is a dial Lewis can turn:
 * swapping the storefront photo is a paste into a text field, not a deploy.
 * It also means no filesystem probing at render time, so behaviour is the
 * same locally, on Vercel, and with Supabase unreachable.
 *
 * A slot with no source does NOT render a gap or a broken image. It renders
 * `PhotoFrame`'s designed panel — the wave motif, dot grid and slot title in
 * the brand palette — so the page reads as finished whether or not a photo
 * has been supplied. Photographs upgrade the page; their absence never
 * breaks it.
 *
 * PROVENANCE NOTE: the defaults below are all empty. Aqua TCG's own
 * photography could not be retrieved when this was built — aquatcg.co.uk is
 * unreachable from the build environment (the egress proxy denies the
 * CONNECT outright), so nothing was copied from the live site. Every slot
 * is waiting on assets supplied by the client.
 */

/** Where a photo sits, and how it should be framed. */
export type PhotoSlot = {
  /** Content key holding the image source. */
  key: string;
  /** Content key holding the alt text. */
  altKey: string;
  /** Shown on the designed panel when no photo is set. */
  placeholderTitle: string;
  /** Short line under the placeholder title. */
  placeholderNote: string;
  /** CSS aspect-ratio, e.g. "16 / 9". */
  aspect: string;
};

export const PHOTO_SLOTS = {
  /** Optional backdrop behind the hero lockup. Off by default. */
  heroBackdrop: {
    key: "photo.hero_src",
    altKey: "photo.hero_alt",
    placeholderTitle: "In the shop",
    placeholderNote: "Hero backdrop",
    aspect: "16 / 9",
  },
  /** Full-bleed band: the singles wall in situ. */
  wall: {
    key: "photo.wall_src",
    altKey: "photo.wall_alt",
    placeholderTitle: "The singles wall",
    placeholderNote: "Over a thousand cards, changing daily",
    aspect: "21 / 9",
  },
  /** The counter — buying, selling and trading in person. */
  counter: {
    key: "photo.counter_src",
    altKey: "photo.counter_alt",
    placeholderTitle: "At the counter",
    placeholderNote: "Valuations while you wait",
    aspect: "4 / 3",
  },
  /** James and Lewis, in the story panel. */
  founders: {
    key: "photo.founders_src",
    altKey: "photo.founders_alt",
    placeholderTitle: "James & Lewis",
    placeholderNote: "Gateshead, since 2024",
    aspect: "4 / 5",
  },
  /** The unit on the Upper Green Mall, in the visit panel. */
  storefront: {
    key: "photo.storefront_src",
    altKey: "photo.storefront_alt",
    placeholderTitle: "The Crescent",
    placeholderNote: "Upper Green Mall, Metrocentre",
    aspect: "16 / 9",
  },
} as const satisfies Record<string, PhotoSlot>;

export type PhotoSlotName = keyof typeof PHOTO_SLOTS;

/** A slot resolved against the current content. */
export type ResolvedPhoto = {
  slot: PhotoSlot;
  /** Absent when no photo has been supplied for this slot. */
  src: string | null;
  alt: string;
  /**
   * True for `http(s)` sources. These skip the Next image optimiser, since
   * an arbitrary host pasted into admin won't be in `remotePatterns` and
   * would otherwise 400 at request time. Local paths under `/public` are
   * the recommended route and stay optimised.
   */
  external: boolean;
};

/**
 * Resolve a slot against the merged content map.
 *
 * Anything that isn't a usable path is treated as unset — a stray value
 * should fall back to the designed panel, not render a broken image on a
 * public page.
 */
export function resolvePhoto(
  content: Record<string, string>,
  name: PhotoSlotName,
): ResolvedPhoto {
  const slot = PHOTO_SLOTS[name];
  const raw = (content[slot.key] ?? "").trim();
  const usable =
    raw.startsWith("/") ||
    raw.startsWith("https://") ||
    raw.startsWith("http://");

  return {
    slot,
    src: usable ? raw : null,
    alt: (content[slot.altKey] ?? "").trim() || slot.placeholderTitle,
    external: usable && !raw.startsWith("/"),
  };
}
