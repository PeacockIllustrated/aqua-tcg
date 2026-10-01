import "server-only";
import { NATIONAL_DEX } from "@/lib/fixtures/pokedex";
import type {
  GradingCompany,
  Grade,
  ItemCondition,
  LewisBinderEntry,
  LewisSubmission,
  LewisSubmissionItem,
  LewisUser,
  LewisWishlistEntry,
} from "@/lib/supabase/types";

/* ─────────────────────────────────────────────────────────────────
 * Sample signed-in customer, used by the preview versions of the
 * account pages (/binder, /settings, /submission, checkout). Every
 * card id is a real fixture id so names and images resolve.
 * ───────────────────────────────────────────────────────────────── */

export const PREVIEW_USER_ID = "preview-user";

const CREATED = "2026-03-02T09:30:00.000Z";

export const PREVIEW_PROFILE: LewisUser = {
  id: PREVIEW_USER_ID,
  email: "sam.collector@example.com",
  full_name: "Sam Collector",
  phone: "07700 900123",
  postcode: "LS6 2QT",
  country: "GB",
  role: "seller",
  paypal_email: "sam.collector@example.com",
  consent_service_emails: true,
  consent_marketing_buylist: true,
  consent_marketing_shop: true,
  consent_aggregate_data: false,
  consent_updated_at: "2026-08-14T18:05:00.000Z",
  privacy_policy_accepted_at: "2026-03-02T09:31:00.000Z",
  created_at: CREATED,
  updated_at: "2026-08-14T18:05:00.000Z",
};

/* ─── binder ───────────────────────────────────────────────────── */

type EntrySeed = {
  card: string;
  qty?: number;
  cond?: ItemCondition;
  graded?: [GradingCompany, Grade];
  grail?: boolean;
  note?: string;
  source?: LewisBinderEntry["source"];
};

// A believable mid-sized WOTC-era collection: the Base Set starters
// and their evolutions, a handful of holos, a couple of slabs, some
// Jungle / Fossil pickups, and a few Trainers + Energy for the shelf.
const BINDER_SEEDS: EntrySeed[] = [
  { card: "base1-4", graded: ["PSA", "8"], grail: true, note: "Childhood pull — finally slabbed." },
  { card: "base1-46", qty: 2 },
  { card: "base1-24" },
  { card: "base1-44" },
  { card: "base1-30", cond: "LP" },
  { card: "base1-15", cond: "LP", note: "Small whitening on the back edge." },
  { card: "base1-63", qty: 3 },
  { card: "base1-42" },
  { card: "base1-2", graded: ["CGC", "8.5"] },
  { card: "base1-58", qty: 4 },
  { card: "base1-14", cond: "MP" },
  { card: "base1-1" },
  { card: "base1-43", qty: 2 },
  { card: "base1-32" },
  { card: "base1-10", cond: "LP" },
  { card: "base1-16" },
  { card: "base1-35", qty: 2 },
  { card: "base1-6", cond: "LP" },
  { card: "base1-26" },
  { card: "base1-18" },
  { card: "base1-68" },
  { card: "base1-12" },
  { card: "base1-28" },
  { card: "base1-23" },
  { card: "base1-50", qty: 2 },
  { card: "base1-29" },
  { card: "base1-52" },
  { card: "base1-34" },
  { card: "base1-8" },
  { card: "base2-51", qty: 2, source: "shop_order" },
  { card: "base2-12" },
  { card: "base2-4", cond: "LP" },
  { card: "base2-11" },
  { card: "base2-10" },
  { card: "base2-54", qty: 2 },
  { card: "base3-5", graded: ["PSA", "9"], source: "shop_order" },
  { card: "base3-4" },
  { card: "base3-10", cond: "LP" },
  { card: "base3-2" },
  { card: "base3-12" },
  { card: "base3-15" },
  { card: "basep-1" },
  // Shelf — Trainer + Energy
  { card: "base1-88" },
  { card: "base1-91", qty: 3 },
  { card: "base1-93", qty: 2 },
  { card: "base1-96", qty: 2 },
  { card: "base1-98", qty: 12 },
  { card: "base1-102", qty: 9 },
];

function daysAgoIso(days: number): string {
  return new Date(Date.parse("2026-09-28T12:00:00.000Z") - days * 86_400_000)
    .toISOString();
}

export const MOCK_BINDER_ENTRIES: LewisBinderEntry[] = BINDER_SEEDS.map(
  (s, i) => {
    const graded = s.graded !== undefined;
    const stamp = daysAgoIso(BINDER_SEEDS.length - i);
    return {
      id: `preview-entry-${String(i + 1).padStart(3, "0")}`,
      user_id: PREVIEW_USER_ID,
      card_id: s.card,
      variant: graded ? "graded" : "raw",
      condition: graded ? null : (s.cond ?? "NM"),
      grading_company: graded ? s.graded![0] : null,
      grade: graded ? s.graded![1] : null,
      quantity: s.qty ?? 1,
      is_grail: s.grail ?? false,
      note: s.note ?? null,
      acquired_at: stamp,
      source: s.source ?? "manual",
      source_order_id: null,
      graded_image_url: null,
      created_at: stamp,
      updated_at: stamp,
    };
  },
);

// Wishlist entries point at each dex slot's canonical sample card —
// that's the id the binder's missing-slot wishlist toggle checks.
const WISHLIST_SEEDS: Array<{ dex: number; target: number | null }> = [
  { dex: 150, target: 120 }, // Mewtwo
  { dex: 151, target: null }, // Mew
  { dex: 143, target: 45 }, // Snorlax
  { dex: 131, target: 60 }, // Lapras
  { dex: 3, target: 250 }, // Venusaur
];

export const MOCK_WISHLIST_ENTRIES: LewisWishlistEntry[] =
  WISHLIST_SEEDS.flatMap((w, i) => {
    const dex = NATIONAL_DEX.find((d) => d.number === w.dex);
    if (!dex?.sampleCardId) return [];
    return [
      {
        id: `preview-wish-${i + 1}`,
        user_id: PREVIEW_USER_ID,
        card_id: dex.sampleCardId,
        target_price_gbp: w.target,
        notified_at: null,
        created_at: CREATED,
        updated_at: CREATED,
      },
    ];
  });

/* ─── buylist submissions ──────────────────────────────────────── */

export const SAMPLE_SUBMISSION_REFERENCE = "CB-2026-000042";

type ItemSeed = {
  card: string;
  qty: number;
  per: number;
  cond?: ItemCondition;
  graded?: [GradingCompany, Grade];
};

const DRAFT_ITEMS: ItemSeed[] = [
  { card: "base1-2", qty: 1, per: 142.5, cond: "NM" },
  { card: "base1-16", qty: 1, per: 38.4, cond: "LP" },
  { card: "base3-5", qty: 1, per: 96, graded: ["PSA", "8"] },
  { card: "base2-11", qty: 2, per: 21.75, cond: "NM" },
  { card: "base1-58", qty: 6, per: 1.8, cond: "NM" },
];

function buildItems(
  submissionId: string,
  seeds: ItemSeed[],
): LewisSubmissionItem[] {
  return seeds.map((s, i) => {
    const graded = s.graded !== undefined;
    return {
      id: `${submissionId}-item-${i + 1}`,
      submission_id: submissionId,
      card_id: s.card,
      variant: graded ? "graded" : "raw",
      condition: graded ? null : (s.cond ?? "NM"),
      grading_company: graded ? s.graded![0] : null,
      grade: graded ? s.graded![1] : null,
      quantity: s.qty,
      offered_amount_per: s.per,
      offered_amount_total: +(s.per * s.qty).toFixed(2),
      offer_breakdown: {},
      verified_condition: null,
      verified_grade: null,
      revised_amount_per: null,
      revised_amount_total: null,
      verification_notes: null,
      verified_by: null,
      verified_at: null,
      created_at: CREATED,
    };
  });
}

function buildSubmission(
  id: string,
  reference: string,
  status: LewisSubmission["status"],
  items: LewisSubmissionItem[],
): LewisSubmission {
  const total = +items
    .reduce((s, i) => s + Number(i.offered_amount_total), 0)
    .toFixed(2);
  const submitted = status === "draft" ? null : new Date().toISOString();
  return {
    id,
    reference,
    seller_id: PREVIEW_USER_ID,
    status,
    payout_method: "paypal",
    payout_target: status === "draft" ? null : PREVIEW_PROFILE.paypal_email,
    shipping_method: "royal_mail_tracked",
    total_offered: total,
    total_paid: null,
    margin_config_id: null,
    terms_accepted_at: submitted,
    submitted_at: submitted,
    received_at: null,
    paid_at: null,
    notes_internal: null,
    notes_seller: null,
    created_at: CREATED,
    updated_at: submitted ?? CREATED,
  };
}

export function getSampleDraftSubmission(): {
  submission: LewisSubmission;
  items: LewisSubmissionItem[];
} {
  const items = buildItems("preview-draft", DRAFT_ITEMS);
  return {
    submission: buildSubmission(
      "preview-draft",
      "CB-2026-000041",
      "draft",
      items,
    ),
    items,
  };
}

/** A submitted package for any reference — powers the preview
 *  confirmation page. */
export function getSampleSubmittedSubmission(reference: string): {
  submission: LewisSubmission;
  items: LewisSubmissionItem[];
} {
  const items = buildItems("preview-submitted", DRAFT_ITEMS);
  return {
    submission: buildSubmission(
      "preview-submitted",
      reference,
      "submitted",
      items,
    ),
    items,
  };
}
