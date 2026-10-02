/**
 * Preview mode — lets a prospect walk every page of the site (including
 * the signed-in customer areas and the admin panel) without an account.
 *
 *   NEXT_PUBLIC_DEMO_MODE   on by default; set to "false" for a real
 *                           shop to restore the sign-in gates.
 *
 * When preview mode is on and nobody is signed in, gated pages render
 * sample data from `lib/mock/*` under a <PreviewBanner />. If Supabase
 * isn't configured at all (`hasDatabase` false), every data read falls
 * back to the same sample data so the site still renders end-to-end.
 *
 * Client-safe: only reads NEXT_PUBLIC_* vars.
 */
export const previewMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export const hasDatabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
