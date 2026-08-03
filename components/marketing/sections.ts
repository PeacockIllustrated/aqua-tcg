/**
 * Anchor targets for the one-pager.
 *
 * Lives in its own module rather than alongside `MarketingNav` because
 * both a client component (the nav) and a server component (the footer)
 * need it. A server component importing a value from a `"use client"`
 * module receives a client-reference proxy instead of the value itself,
 * which fails at render — the split keeps this a plain shared constant.
 *
 * Each `id` must match a section's `id` in `app/(marketing)/page.tsx`;
 * those sections carry `scroll-mt-*` so the sticky header doesn't cover
 * their heading when jumped to.
 */
export const NAV_SECTIONS = [
  { id: "trade", label: "Buy · Sell · Trade", short: "Trade" },
  { id: "wall", label: "The wall", short: "Wall" },
  { id: "stock", label: "Stock", short: "Stock" },
  { id: "story", label: "Story", short: "Story" },
  { id: "visit", label: "Visit", short: "Visit" },
  { id: "contact", label: "Contact", short: "Contact" },
] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];
