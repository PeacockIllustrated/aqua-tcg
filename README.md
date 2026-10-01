# TCG Shop Platform

A white-label website for independent Pokémon TCG shops: a **shopfront** for singles, slabs and sealed products, and a **buylist** where customers get an instant GBP cash offer for their cards and post them in. One codebase can be reskinned for any shop with env vars.

Built on Next.js 16 (App Router), React 19, Tailwind CSS 4 and Supabase (Postgres, Auth and RLS), and deployed on Vercel.

---

## What a shop gets

| Area | What it does |
|---|---|
| **Shopfront** | Curated listings, featured picks on the homepage, basket, checkout and order tracking. |
| **Buylist** | Customers search the catalogue, choose a condition and see an instant offer. Offers are computed from live market prices and the shop's margin settings. |
| **Submissions** | A send-in flow with a reference number. Staff receive, review and pay out from the admin panel. |
| **Collector binder** | Customers track their collection and wishlist, and can open virtual packs. |
| **Demand & sourcing** | Admin views of what customers are wishing for, so the shop knows what to buy in. |
| **Admin panel** | Pricing settings (global, per-set, per-rarity and per-condition), inventory, orders, submissions, users and price sync status. |
| **Nightly price sync** | Vercel Cron pulls TCGCSV market prices and FX rates. |

---

## Rebranding for a shop

All shop identity lives in [`lib/brand.ts`](lib/brand.ts) and is set with env vars, so a new shop needs no code changes:

```bash
NEXT_PUBLIC_SHOP_NAME="Tyneside Cards"          # last word gets the accent colour in the wordmark
NEXT_PUBLIC_SHOP_TAGLINE="Buy, sell, repeat."
NEXT_PUBLIC_SHOP_LOCATION="Newcastle · UK"
NEXT_PUBLIC_SHOP_EMAIL="hello@tynesidecards.co.uk"
NEXT_PUBLIC_SHOP_ADDRESS="12 Grey Street|Newcastle|NE1 6AE|United Kingdom"
NEXT_PUBLIC_SHOP_LOGO="/brand/tyneside.svg"     # drop the file in public/
NEXT_PUBLIC_THEME="ember"                       # neutral | ember | forest | violet
```

The default with nothing set is **"Your Card Shop"** in a neutral greyscale theme with a placeholder logo.

**Colours.** Three CSS variables in [`app/globals.css`](app/globals.css) carry a shop's brand: `--color-brand` (primary), `--color-tint` (secondary surfaces) and `--color-highlight` (wordmark and badges). Every `bg-brand` / `text-tint` / `bg-highlight` utility reads from them. To add a bespoke colourway, add a `[data-theme="shopname"]` block next to the existing presets and add its name to `THEMES` in `lib/brand.ts`. Keep `brand` mid-luminance so both black and white text stay readable on it.

### Pitch / demo mode

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

This shows a floating **"Your colours here"** switcher in the bottom-right corner, so a prospect can flip through the colourways live during a pitch. Leave it off for real shops.

---

## Setup

```bash
pnpm install
cp .env.example .env.local    # fill in Supabase keys and the brand vars above
pnpm dev                      # http://localhost:3000
```

1. **Supabase.** Create a project and run the migrations in `supabase/migrations/` in order (SQL Editor or `supabase db push`).
2. **Auth redirect.** In Supabase → Authentication → URL Configuration, add `http://localhost:3000/auth/callback` and the production callback URL.
3. **Admin user.** Sign up, then run `update lewis_users set role = 'admin' where email = 'you@example.com';`
4. **Price sync.** Set `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`. The Vercel crons in `vercel.json` run nightly, or trigger a sync from `/admin/sync`.

Scripts: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`.

> The database tables still use the historical `lewis_` prefix. It isn't visible to customers. Renaming it to something neutral is a separate migration, best done before the first new shop goes live on a fresh database.

---

## Not finished yet

- **Payments.** Stripe checkout and PayPal payouts are stubbed: orders are created and held, then payment is taken manually.
- **Transactional email and shipping labels.**
- **Legal pages.** Terms, privacy and returns links are placeholders and need copy for each shop.
