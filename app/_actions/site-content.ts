"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FIELD_BY_KEY } from "@/lib/marketing/content";
import type { AnnouncementTone } from "@/lib/supabase/types";

/**
 * Admin-only mutations for the marketing CMS.
 *
 * Authorisation is enforced by RLS (`lewis_site_content: admin write`
 * and `lewis_announcements: admin all`, both gated on the
 * `public.is_admin()` helper from migration 0004). The signed-in check
 * here is a cheap early exit with a readable message, not the security
 * boundary — server actions are POST endpoints reachable independently
 * of the middleware gate on `/admin/*`, so the database has to be the
 * one saying no.
 *
 * Reads live in `lib/marketing/queries.ts` so they aren't exposed as
 * RPC endpoints.
 */

type Result = { ok: boolean; error?: string };

const TONES: AnnouncementTone[] = ["ocean", "wave", "sun", "ink"];

function parseTone(raw: FormDataEntryValue | null): AnnouncementTone {
  const value = typeof raw === "string" ? raw : "";
  return (TONES as string[]).includes(value)
    ? (value as AnnouncementTone)
    : "sun";
}

/** Empty string / whitespace → null, so blank inputs don't store "". */
function nullableText(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** `datetime-local` value → ISO string, or null when left blank. */
function nullableTimestamp(raw: FormDataEntryValue | null): string | null {
  const text = nullableText(raw);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Revalidate every surface that renders marketing copy. */
function revalidateMarketing(): void {
  revalidatePath("/");
  revalidatePath("/admin/site");
}

/**
 * Persist copy overrides.
 *
 * Only keys declared in `lib/marketing/content.ts` are accepted —
 * unknown keys are dropped rather than written, so a tampered form
 * post can't seed arbitrary rows.
 *
 * A field submitted empty has its row DELETED rather than stored as
 * "". That makes "clear the box" mean "go back to the built-in
 * default", which is the behaviour the admin screen advertises.
 */
export async function saveSiteContent(
  entries: Record<string, string>,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const toUpsert: { key: string; value: string; updated_by: string }[] = [];
  const toDelete: string[] = [];

  for (const [key, raw] of Object.entries(entries)) {
    if (!FIELD_BY_KEY[key]) continue;
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value.length === 0) toDelete.push(key);
    else toUpsert.push({ key, value, updated_by: user.id });
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from("lewis_site_content")
      .upsert(toUpsert, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("lewis_site_content")
      .delete()
      .in("key", toDelete);
    if (error) return { ok: false, error: error.message };
  }

  revalidateMarketing();
  return { ok: true };
}

export type AnnouncementInput = {
  id?: string;
  title: string;
  body: string | null;
  href: string | null;
  cta_label: string | null;
  tone: AnnouncementTone;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort: number;
};

/** Build an `AnnouncementInput` from a submitted form. */
export async function announcementFromFormData(
  formData: FormData,
): Promise<AnnouncementInput> {
  const id = nullableText(formData.get("id"));
  const sortRaw = Number(formData.get("sort"));
  return {
    ...(id ? { id } : {}),
    title: (nullableText(formData.get("title")) ?? "").slice(0, 200),
    body: nullableText(formData.get("body")),
    href: nullableText(formData.get("href")),
    cta_label: nullableText(formData.get("cta_label")),
    tone: parseTone(formData.get("tone")),
    is_active: formData.get("is_active") === "on",
    starts_at: nullableTimestamp(formData.get("starts_at")),
    ends_at: nullableTimestamp(formData.get("ends_at")),
    sort: Number.isFinite(sortRaw) ? sortRaw : 0,
  };
}

/** Create a new announcement, or update in place when `id` is present. */
export async function saveAnnouncement(
  input: AnnouncementInput,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const title = input.title.trim();
  if (title.length === 0) return { ok: false, error: "Title is required" };

  if (
    input.starts_at &&
    input.ends_at &&
    new Date(input.starts_at) > new Date(input.ends_at)
  ) {
    return { ok: false, error: "“Starts” must be before “ends”" };
  }

  const payload = {
    title,
    body: input.body,
    href: input.href,
    cta_label: input.cta_label,
    tone: input.tone,
    is_active: input.is_active,
    starts_at: input.starts_at,
    ends_at: input.ends_at,
    sort: input.sort,
  };

  const { error } = input.id
    ? await supabase
        .from("lewis_announcements")
        .update(payload)
        .eq("id", input.id)
    : await supabase
        .from("lewis_announcements")
        .insert({ ...payload, created_by: user.id });

  if (error) return { ok: false, error: error.message };

  revalidateMarketing();
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lewis_announcements")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateMarketing();
  return { ok: true };
}

export async function setAnnouncementActive(
  id: string,
  isActive: boolean,
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lewis_announcements")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateMarketing();
  return { ok: true };
}
