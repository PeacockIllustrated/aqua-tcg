/**
 * White-label brand config — the single place a shop's identity lives.
 *
 * Every customer-facing mention of the shop's name, tagline, contact
 * address and logo reads from here, so re-skinning the site for a new
 * shop is an env-var change, not a code change:
 *
 *   NEXT_PUBLIC_SHOP_NAME="Tyneside Cards"
 *   NEXT_PUBLIC_SHOP_TAGLINE="Buy, sell, repeat."
 *   NEXT_PUBLIC_SHOP_LOCATION="Newcastle · UK"
 *   NEXT_PUBLIC_SHOP_EMAIL="hello@tynesidecards.co.uk"
 *   NEXT_PUBLIC_SHOP_ADDRESS="12 Grey Street|Newcastle|NE1 6AE|United Kingdom"
 *   NEXT_PUBLIC_SHOP_LOGO="/brand/tyneside.svg"
 *   NEXT_PUBLIC_THEME="ember"          # neutral | ember | forest | violet
 *   NEXT_PUBLIC_DEMO_MODE="false"      # real shop: hide "Pick your colours",
 *                                      # restore sign-in gates (lib/preview.ts)
 *
 * Colours live in `app/globals.css` as `--color-brand` / `--color-tint`
 * / `--color-highlight`; presets are selected via `data-theme` on <html>.
 */

export const THEMES = ["neutral", "ember", "forest", "violet"] as const;
export type ThemeName = (typeof THEMES)[number];

/** Accent hex per preset — mirrors the `[data-theme]` blocks in
 *  app/globals.css (keep in sync). Used by the colour picker UI. */
export const THEME_PALETTES: Record<
  ThemeName,
  { brand: string; tint: string; highlight: string }
> = {
  neutral: { brand: "#6b7280", tint: "#d4d4d8", highlight: "#e7e5e4" },
  ember: { brand: "#e2553b", tint: "#ffc9a8", highlight: "#ffd23f" },
  forest: { brand: "#2f9e6e", tint: "#a8e6c9", highlight: "#f2d14b" },
  violet: { brand: "#7c5cd6", tint: "#c9b8ff", highlight: "#ffd166" },
};

function env(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  return v ? v : fallback;
}

const name = env(process.env.NEXT_PUBLIC_SHOP_NAME, "Your Card Shop");

/** Split the name for the two-tone wordmark: last word gets the
 *  highlight colour ("Your Card" + "Shop"). Single-word names render
 *  in one colour. */
function splitWordmark(full: string): [string, string] {
  const i = full.lastIndexOf(" ");
  return i === -1 ? [full, ""] : [full.slice(0, i), full.slice(i + 1)];
}

const themeEnv = process.env.NEXT_PUBLIC_THEME as ThemeName | undefined;

export const brand = {
  name,
  wordmark: splitWordmark(name),
  tagline: env(process.env.NEXT_PUBLIC_SHOP_TAGLINE, "Buy, sell, repeat."),
  description: env(
    process.env.NEXT_PUBLIC_SHOP_DESCRIPTION,
    "Buy graded and raw Pokémon cards from a local UK dealer, or sell yours for an instant GBP offer.",
  ),
  location: env(process.env.NEXT_PUBLIC_SHOP_LOCATION, "Pokémon TCG · UK"),
  supportEmail: env(process.env.NEXT_PUBLIC_SHOP_EMAIL, "hello@yourcardshop.co.uk"),
  /** Postal address for buylist send-ins, lines split on "|". */
  address: env(
    process.env.NEXT_PUBLIC_SHOP_ADDRESS,
    "[Shop address line 1]|[Town]|[Postcode]|United Kingdom",
  ).split("|"),
  logo: env(process.env.NEXT_PUBLIC_SHOP_LOGO, "/brand-mark.svg"),
  theme: (themeEnv && (THEMES as readonly string[]).includes(themeEnv)
    ? themeEnv
    : "neutral") as ThemeName,
  /** Pitch/preview mode — see lib/preview.ts. On unless set to "false". */
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
} as const;
