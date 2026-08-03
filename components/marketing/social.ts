/**
 * Social channels rendered in the contact section and the footer.
 *
 * `key` indexes into resolved site content — a channel whose URL is
 * blank is filtered out at render time rather than shown as a dead
 * link, which is how Facebook behaves until its URL is confirmed.
 */
export const SOCIAL_LINKS = [
  { key: "social.instagram", label: "Instagram", handle: "@aquatcguk" },
  { key: "social.youtube", label: "YouTube", handle: "@aqua_tcg" },
  { key: "social.facebook", label: "Facebook", handle: "Aqua TCG" },
] as const;

export type SocialLink = (typeof SOCIAL_LINKS)[number];
