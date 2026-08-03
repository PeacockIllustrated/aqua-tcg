/**
 * Reads for the marketing one-pager and the /admin/site editor.
 *
 * Kept out of `app/_actions/*` on purpose: a `"use server"` module
 * exposes every export as a callable RPC endpoint, and these are plain
 * server-side reads with no reason to be reachable from the client.
 *
 * Every function degrades to the in-code defaults rather than throwing.
 * The public page must render on a fresh clone with no Supabase project,
 * no migration 0014, and no rows — that is the common case for a new
 * environment, not an edge case.
 */

import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CONTENT, resolveContent } from "./content";
import type { LewisAnnouncement, LewisSiteContent } from "@/lib/supabase/types";

/**
 * Resolved marketing copy — DB overrides merged over code defaults.
 *
 * Wrapped in React's `cache()` so the nav, page body and footer share a
 * single round-trip per render. Deliberately not `unstable_cache`: the
 * Supabase server client reads cookies, which Next 16 forbids inside a
 * cached scope (same reasoning as `_actions/margins.ts`).
 */
export const getSiteContent = cache(
  async (): Promise<Record<string, string>> => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("lewis_site_content")
        .select("key, value");

      if (error || !data) return { ...DEFAULT_CONTENT };

      const overrides = Object.fromEntries(
        (data as Pick<LewisSiteContent, "key" | "value">[]).map((r) => [
          r.key,
          r.value,
        ]),
      );
      return resolveContent(overrides);
    } catch {
      return { ...DEFAULT_CONTENT };
    }
  },
);

/**
 * Announcements to show in the public bar.
 *
 * The `is_active` / window filtering is enforced by RLS for anonymous
 * readers, but an admin browsing the public page would otherwise see
 * their own drafts — so the same predicate is applied here explicitly.
 */
export const getLiveAnnouncements = cache(
  async (): Promise<LewisAnnouncement[]> => {
    try {
      const supabase = await createClient();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("lewis_announcements")
        .select("*")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("sort", { ascending: true })
        .order("created_at", { ascending: false });

      if (error || !data) return [];
      return data as LewisAnnouncement[];
    } catch {
      return [];
    }
  },
);

/** Every announcement, including drafts and expired. Admin-only via RLS. */
export async function listAllAnnouncements(): Promise<LewisAnnouncement[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lewis_announcements")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as LewisAnnouncement[];
  } catch {
    return [];
  }
}

/**
 * Raw override rows keyed by content key — what /admin/site pre-fills
 * its inputs with. Distinct from `getSiteContent()`: this returns only
 * what has actually been overridden, so the editor can show an empty
 * box (meaning "using the default") rather than echoing the default
 * back as if Lewis had typed it.
 */
export async function getContentOverrides(): Promise<Record<string, string>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lewis_site_content")
      .select("key, value");

    if (error || !data) return {};
    return Object.fromEntries(
      (data as Pick<LewisSiteContent, "key" | "value">[]).map((r) => [
        r.key,
        r.value,
      ]),
    );
  } catch {
    return {};
  }
}

/**
 * True when migration 0014 has been applied and the tables are
 * reachable. Used by /admin/site to explain *why* saving is disabled
 * instead of silently swallowing every write.
 */
export async function isCmsReady(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("lewis_site_content")
      .select("key")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}
