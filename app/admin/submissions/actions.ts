"use server";

import { revalidatePath } from "next/cache";
import { getAdminViewer, PREVIEW_SAVE_MESSAGE } from "@/app/_actions/admin";
import { getMarginConfig } from "@/app/_actions/margins";
import { revisedOfferPer } from "@/lib/mock/admin-offer-revision";
import type {
  ItemCondition,
  LewisSubmission,
  LewisSubmissionItem,
  SubmissionStatus,
} from "@/lib/supabase/types";

/**
 * Admin buylist state machine: move a submission along
 * received → under review → offer revised → paid (or rejected).
 *
 * When the transition carries verification results (revised offer or
 * approve & pay), the verified condition per raw item is persisted and
 * the revised amounts are recomputed server-side from the declared
 * offer and the live condition multipliers — the client only says
 * which condition it saw.
 */

export type SubmissionTransitionResult =
  | { ok: true; totalPaid?: number }
  | { ok: false; error: string; preview?: boolean };

const ALLOWED: Record<SubmissionStatus, SubmissionStatus[]> = {
  draft: [],
  submitted: ["received", "cancelled"],
  awaiting_cards: ["received", "cancelled"],
  received: ["under_review", "rejected"],
  under_review: ["offer_revised", "paid", "rejected"],
  offer_revised: ["paid", "rejected"],
  approved: ["paid"],
  paid: [],
  rejected: ["returned"],
  returned: [],
  cancelled: [],
};

export async function updateSubmissionStatus(
  submissionId: string,
  next: SubmissionStatus,
  verified: Record<string, ItemCondition | ""> = {},
): Promise<SubmissionTransitionResult> {
  const viewer = await getAdminViewer();
  if (viewer.preview) {
    return { ok: false, error: PREVIEW_SAVE_MESSAGE, preview: true };
  }
  if (!viewer.isAdmin) return { ok: false, error: "Admin only" };
  const supabase = viewer.supabase;

  const { data: existing } = await supabase
    .from("lewis_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Submission not found." };
  const sub = existing as LewisSubmission;

  if (!ALLOWED[sub.status]?.includes(next)) {
    return {
      ok: false,
      error: `Can't move a submission from ${sub.status} to ${next}.`,
    };
  }

  const now = new Date().toISOString();
  const patch: Partial<LewisSubmission> = { status: next };
  if (next === "received") patch.received_at = sub.received_at ?? now;

  let totalPaid: number | undefined;
  if (next === "offer_revised" || next === "paid") {
    const { data: itemRows } = await supabase
      .from("lewis_submission_items")
      .select("*")
      .eq("submission_id", sub.id);
    const items = (itemRows ?? []) as LewisSubmissionItem[];
    const config = await getMarginConfig();

    let total = 0;
    for (const item of items) {
      const cond = verified[item.id] || null;
      let per = Number(item.offered_amount_per);
      if (cond && item.variant === "raw" && item.condition) {
        per = revisedOfferPer(per, item.condition, cond, config.condition_multipliers);
        const lineTotal = Math.round(per * item.quantity * 100) / 100;
        const { error } = await supabase
          .from("lewis_submission_items")
          .update({
            verified_condition: cond,
            revised_amount_per: per,
            revised_amount_total: lineTotal,
            verified_by: viewer.user?.id ?? null,
            verified_at: now,
          })
          .eq("id", item.id);
        if (error) return { ok: false, error: error.message };
      }
      total += per * item.quantity;
    }
    total = Math.round(total * 100) / 100;
    if (next === "paid") {
      patch.total_paid = total;
      patch.paid_at = now;
      totalPaid = total;
    }
  }

  const { error } = await supabase
    .from("lewis_submissions")
    .update(patch)
    .eq("id", sub.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${sub.reference}`);
  revalidatePath("/admin");
  return { ok: true, totalPaid };
}
