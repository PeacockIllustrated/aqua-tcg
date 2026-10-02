"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/preview-server";
import { PREVIEW_PROFILE } from "@/lib/mock/mock-customer";
import { previewError, type PreviewError } from "@/lib/mock/preview-actions";
import type { LewisUser } from "@/lib/supabase/types";

/* ─────────────────────────────────────────────────────────────────
 * Phase 6 · Slice C1 · Consent + account deletion.
 *
 * `consent_service_emails` is intentionally NOT editable here —
 * transactional mail is essential to the service, so there's no
 * legal opt-out short of deleting the account.
 *
 * Preview (signed out with preview mode on, or no DB): reads return the
 * sample customer's consent; writes return a `PreviewError`.
 * ───────────────────────────────────────────────────────────────── */

export type ConsentSnapshot = Pick<
  LewisUser,
  | "consent_service_emails"
  | "consent_marketing_buylist"
  | "consent_marketing_shop"
  | "consent_aggregate_data"
  | "consent_updated_at"
  | "privacy_policy_accepted_at"
>;

export async function getMyConsent(): Promise<ConsentSnapshot | null> {
  const { supabase, user, preview } = await getViewer();
  if (preview) {
    return {
      consent_service_emails: PREVIEW_PROFILE.consent_service_emails,
      consent_marketing_buylist: PREVIEW_PROFILE.consent_marketing_buylist,
      consent_marketing_shop: PREVIEW_PROFILE.consent_marketing_shop,
      consent_aggregate_data: PREVIEW_PROFILE.consent_aggregate_data,
      consent_updated_at: PREVIEW_PROFILE.consent_updated_at,
      privacy_policy_accepted_at: PREVIEW_PROFILE.privacy_policy_accepted_at,
    };
  }
  if (!user || !supabase) return null;

  const { data } = await supabase
    .from("lewis_users")
    .select(
      "consent_service_emails, consent_marketing_buylist, consent_marketing_shop, consent_aggregate_data, consent_updated_at, privacy_policy_accepted_at",
    )
    .eq("id", user.id)
    .maybeSingle();
  return (data as ConsentSnapshot | null) ?? null;
}

export type ConsentField =
  | "consent_marketing_buylist"
  | "consent_marketing_shop"
  | "consent_aggregate_data";

export async function updateConsent(
  field: ConsentField,
  value: boolean,
): Promise<void | PreviewError> {
  const { supabase, user, preview } = await getViewer();
  if (preview) return previewError();
  if (!user || !supabase) redirect("/login?next=/settings");

  const patch: Partial<LewisUser> = {
    [field]: value,
    consent_updated_at: new Date().toISOString(),
  };

  // Mark the privacy policy as reviewed the first time a user touches
  // any consent toggle — proves they saw the surface.
  const { data: existing } = await supabase
    .from("lewis_users")
    .select("privacy_policy_accepted_at")
    .eq("id", user.id)
    .maybeSingle();
  if (!existing?.privacy_policy_accepted_at) {
    patch.privacy_policy_accepted_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("lewis_users")
    .update(patch)
    .eq("id", user.id);
  if (error) throw new Error(`Failed to update consent: ${error.message}`);

  revalidatePath("/settings");
}

/**
 * Hard-delete the caller's account. Uses the service-role admin client
 * to drop the `auth.users` row — the FK cascade chain from migrations
 * 0001 + 0006 takes care of lewis_users, lewis_submissions,
 * lewis_submission_items, lewis_binder_entries, lewis_wishlist_entries.
 *
 * Caller must pass the phrase "DELETE MY ACCOUNT" as confirmation so
 * a stray button press can't nuke their data.
 */
export async function deleteMyAccount(
  confirmation: string,
): Promise<void | PreviewError> {
  if (confirmation !== "DELETE MY ACCOUNT") {
    return { error: "Confirmation phrase did not match." };
  }

  const { supabase, user, preview } = await getViewer();
  if (preview) {
    return previewError(
      "Preview: this is the sample account, so there's nothing to delete.",
    );
  }
  if (!user || !supabase) redirect("/login");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(`Failed to delete account: ${error.message}`);

  // Sign out the now-orphaned session. getUser() on the next navigation
  // returns null; middleware redirects as expected.
  await supabase.auth.signOut();

  redirect("/?account_deleted=1");
}
