import "server-only";
import { getAllCards, getCardById, getCardsBySet, getSetById } from "@/lib/fixtures/cards";
import { getMockCardById } from "@/lib/fixtures/mock-adapter";
import { MOCK_LISTINGS } from "./mock-listings";
import type {
  Grade,
  GradingCompany,
  ItemCondition,
  LewisAdminMargins,
  LewisListing,
  LewisOrder,
  LewisOrderItem,
  LewisSubmission,
  LewisSubmissionItem,
  LewisUser,
  PaymentMethod,
  ShippingMethodOption,
  ShopOrderStatus,
  SubmissionStatus,
} from "@/lib/supabase/types";
import type { SyncRunSummary } from "@/lib/prices/types";
import type { MappingResult } from "@/lib/pricing/build-mapping";
import type { TcgPrice, TcgProduct } from "@/lib/pricing/tcgcsv";

/**
 * Admin-panel sample data for preview mode (and for running without
 * Supabase). Shapes mirror the `lewis_*` row types exactly so the admin
 * actions can return these in place of a DB read without any adapter.
 *
 * The story: a small UK card shop a few weeks into trading. A dozen
 * customers, ~11 buylist submissions spread across the pipeline, ten
 * shop orders (three waiting to be packed), wishlist demand clustered
 * on Charizards and modern alt-arts, and a nightly price sync that
 * mostly succeeds.
 *
 * Dates are computed relative to "now" at call time so the dashboard
 * always reads as current. Card ids come from the real fixture
 * catalogue so names, sets and images resolve.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function ago(days: number, hours = 0): string {
  return new Date(Date.now() - days * DAY - hours * HOUR).toISOString();
}

/** Nightly-cron timestamp `days` ago at a fixed UTC hour/minute. */
function nightly(days: number, hourUtc: number, minute: number): string {
  const d = new Date(Date.now() - days * DAY);
  d.setUTCHours(hourUtc, minute, 0, 0);
  // If "today at 04:00" hasn't happened yet, roll back a day.
  if (d.getTime() > Date.now()) d.setTime(d.getTime() - DAY);
  return d.toISOString();
}

export function sampleSetName(cardId: string): string {
  const card = getCardById(cardId);
  const setId = card?.id.split("-")[0] ?? cardId.split("-")[0];
  return getSetById(setId)?.name ?? setId;
}

function cardName(cardId: string): string {
  return getCardById(cardId)?.name ?? cardId;
}

/* ─── Users ─────────────────────────────────────────────────────── */

export const SAMPLE_ADMIN_IDENTITY: Pick<LewisUser, "email" | "full_name" | "role"> = {
  email: "admin@demo-shop.co.uk",
  full_name: "Demo admin",
  role: "admin",
};

type UserSeed = [
  id: string,
  name: string,
  email: string,
  postcode: string,
  joinedDaysAgo: number,
  role?: "admin" | "seller",
];

const USER_SEEDS: UserSeed[] = [
  ["sample-user-01", "Demo admin", "admin@demo-shop.co.uk", "LS1 4AP", 60, "admin"],
  ["sample-user-02", "Priya Shah", "priya.shah@example.com", "LS6 2AB", 41],
  ["sample-user-03", "Tom Hughes", "tom.hughes@example.com", "CF10 1AA", 39],
  ["sample-user-04", "Megan O'Neill", "megan.oneill@example.com", "BT9 5AB", 36],
  ["sample-user-05", "Daniel Okafor", "dan.okafor@example.com", "M14 5RL", 33],
  ["sample-user-06", "Chloe Barnes", "chloe.barnes@example.com", "BS3 4QP", 30],
  ["sample-user-07", "Jamie Fletcher", "jamie.fletcher@example.com", "NE6 1XH", 26],
  ["sample-user-08", "Aisha Rahman", "aisha.rahman@example.com", "B13 9QZ", 24],
  ["sample-user-09", "Owen Price", "owen.price@example.com", "SA1 3RT", 21],
  ["sample-user-10", "Hannah Reeves", "hannah.reeves@example.com", "EH6 7JF", 18],
  ["sample-user-11", "Sam Whitaker", "sam.whitaker@example.com", "NG7 2QL", 16],
  ["sample-user-12", "Ellie Marshall", "ellie.marshall@example.com", "SO15 2HJ", 25],
  ["sample-user-13", "Ryan Doyle", "ryan.doyle@example.com", "L17 8XT", 12],
];

export function sampleUsers(): LewisUser[] {
  return USER_SEEDS.map(([id, name, email, postcode, joined, role]) => ({
    id,
    email,
    full_name: name,
    phone: null,
    postcode,
    country: "GB",
    role: role ?? "seller",
    paypal_email: role === "admin" ? null : email,
    consent_service_emails: true,
    consent_marketing_buylist: joined % 2 === 0,
    consent_marketing_shop: joined % 3 !== 0,
    consent_aggregate_data: true,
    consent_updated_at: ago(joined),
    privacy_policy_accepted_at: ago(joined),
    created_at: ago(joined, 3),
    updated_at: ago(Math.max(0, joined - 5)),
  }));
}

function userById(id: string): LewisUser {
  const u = sampleUsers().find((x) => x.id === id);
  if (!u) throw new Error(`admin-sample: unknown user ${id}`);
  return u;
}

/* ─── Buylist submissions ───────────────────────────────────────── */

type SubItemSeed = {
  card: string;
  qty?: number;
  per: number;
} & (
  | { cond: ItemCondition; company?: never; grade?: never }
  | { company: GradingCompany; grade: Grade; cond?: never }
);

type SubSeed = {
  n: number;
  seller: string;
  status: SubmissionStatus;
  daysAgo: number;
  payout: "paypal" | "store_credit";
  shipping: "royal_mail_tracked" | "send_yourself";
  items: SubItemSeed[];
  note?: string;
  /** For paid submissions: what was actually paid (after verification). */
  paid?: number;
};

const SUB_SEEDS: SubSeed[] = [
  {
    n: 148, seller: "sample-user-07", status: "awaiting_cards", daysAgo: 0.3,
    payout: "paypal", shipping: "royal_mail_tracked",
    items: [
      { card: "swsh7-215", cond: "NM", per: 385 },
      { card: "swsh7-218", cond: "NM", per: 142 },
    ],
  },
  {
    n: 147, seller: "sample-user-08", status: "awaiting_cards", daysAgo: 1.4,
    payout: "store_credit", shipping: "send_yourself",
    items: [
      { card: "sv2-254", cond: "NM", qty: 2, per: 24 },
      { card: "sv3pt5-6", cond: "NM", qty: 3, per: 6.2 },
      { card: "base1-58", cond: "LP", qty: 6, per: 1.8 },
    ],
  },
  {
    n: 146, seller: "sample-user-05", status: "received", daysAgo: 3,
    payout: "paypal", shipping: "royal_mail_tracked",
    items: [
      { card: "base1-4", cond: "LP", per: 235 },
      { card: "base1-2", cond: "NM", per: 118 },
      { card: "base1-15", cond: "LP", per: 82 },
    ],
    note: "Arrived well packed. Charizard has a soft corner — check before quoting.",
  },
  {
    n: 145, seller: "sample-user-02", status: "received", daysAgo: 4,
    payout: "paypal", shipping: "royal_mail_tracked",
    items: [
      { card: "sv3pt5-199", company: "PSA", grade: "10", per: 265 },
      { card: "sv4pt5-232", cond: "NM", per: 48 },
    ],
  },
  {
    n: 144, seller: "sample-user-09", status: "under_review", daysAgo: 5,
    payout: "paypal", shipping: "royal_mail_tracked",
    items: [
      { card: "base3-5", cond: "NM", per: 44 },
      { card: "base3-15", cond: "NM", per: 38 },
      { card: "base3-1", cond: "LP", per: 24 },
      { card: "base2-10", cond: "NM", per: 21 },
    ],
  },
  {
    n: 143, seller: "sample-user-04", status: "offer_revised", daysAgo: 6,
    payout: "paypal", shipping: "royal_mail_tracked",
    items: [
      { card: "neo1-9", cond: "MP", per: 120 },
      { card: "base5-8", cond: "NM", per: 36 },
    ],
    note: "Lugia graded down NM → MP on arrival (whitening on back edges). Revised offer sent.",
  },
  {
    n: 142, seller: "sample-user-13", status: "offer_revised", daysAgo: 8,
    payout: "store_credit", shipping: "send_yourself",
    items: [{ card: "sv8-238", cond: "LP", per: 112 }],
    note: "Declared NM; light surface scratch. Revised to LP.",
  },
  {
    n: 141, seller: "sample-user-06", status: "paid", daysAgo: 12,
    payout: "paypal", shipping: "royal_mail_tracked",
    items: [
      { card: "base1-10", company: "PSA", grade: "9", per: 140 },
      { card: "base1-16", cond: "NM", per: 36 },
      { card: "base1-8", cond: "NM", per: 12 },
    ],
    paid: 188,
  },
  {
    n: 140, seller: "sample-user-03", status: "paid", daysAgo: 15,
    payout: "store_credit", shipping: "royal_mail_tracked",
    items: [
      { card: "swsh12pt5-160", cond: "NM", per: 58 },
      { card: "sv2-254", cond: "NM", per: 24 },
    ],
    paid: 82,
  },
  {
    n: 139, seller: "sample-user-11", status: "rejected", daysAgo: 18,
    payout: "paypal", shipping: "send_yourself",
    items: [{ card: "base5-4", cond: "NM", per: 95 }],
    note: "Failed light test — returned to seller at our cost.",
  },
  {
    n: 138, seller: "sample-user-12", status: "paid", daysAgo: 22,
    payout: "paypal", shipping: "royal_mail_tracked",
    items: [{ card: "base1-2", company: "PSA", grade: "8", per: 165 }],
    paid: 165,
  },
];

const CLOSED: SubmissionStatus[] = ["paid", "rejected", "cancelled", "returned"];
const RECEIVED_OR_LATER: SubmissionStatus[] = [
  "received", "under_review", "offer_revised", "approved", "paid", "rejected", "returned",
];

function buildSubmission(seed: SubSeed): {
  submission: LewisSubmission;
  items: LewisSubmissionItem[];
} {
  const id = `sample-sub-${seed.n}`;
  const submittedAt = ago(seed.daysAgo);
  const items: LewisSubmissionItem[] = seed.items.map((it, i) => {
    const qty = it.qty ?? 1;
    return {
      id: `${id}-item-${i + 1}`,
      submission_id: id,
      card_id: it.card,
      variant: it.company ? "graded" : "raw",
      condition: it.cond ?? null,
      grading_company: it.company ?? null,
      grade: it.grade ?? null,
      quantity: qty,
      offered_amount_per: it.per,
      offered_amount_total: Math.round(it.per * qty * 100) / 100,
      offer_breakdown: {},
      verified_condition: null,
      verified_grade: null,
      revised_amount_per: null,
      revised_amount_total: null,
      verification_notes: null,
      verified_by: null,
      verified_at: null,
      created_at: submittedAt,
    };
  });
  const total =
    Math.round(items.reduce((s, i) => s + i.offered_amount_total, 0) * 100) / 100;
  const seller = userById(seed.seller);
  const receivedAt = RECEIVED_OR_LATER.includes(seed.status)
    ? ago(Math.max(0, seed.daysAgo - 2))
    : null;
  return {
    submission: {
      id,
      reference: `CB-2026-${String(seed.n).padStart(6, "0")}`,
      seller_id: seed.seller,
      status: seed.status,
      payout_method: seed.payout,
      payout_target: seed.payout === "paypal" ? seller.paypal_email : null,
      shipping_method: seed.shipping,
      total_offered: total,
      total_paid: seed.status === "paid" ? (seed.paid ?? total) : null,
      margin_config_id: "sample-margins",
      terms_accepted_at: submittedAt,
      submitted_at: submittedAt,
      received_at: receivedAt,
      paid_at: seed.status === "paid" ? ago(Math.max(0, seed.daysAgo - 4)) : null,
      notes_internal: seed.note ?? null,
      notes_seller: null,
      created_at: ago(seed.daysAgo, 1),
      updated_at: ago(Math.max(0, seed.daysAgo - 1)),
    },
    items,
  };
}

export function sampleSubmissions(): Array<{
  submission: LewisSubmission;
  items: LewisSubmissionItem[];
}> {
  return SUB_SEEDS.map(buildSubmission);
}

export function sampleSubmissionIsOpen(status: SubmissionStatus): boolean {
  return !CLOSED.includes(status);
}

/* ─── Listings ──────────────────────────────────────────────────── */

/** Shop inventory — the same units the shopfront preview shows. */
export function sampleListings(): LewisListing[] {
  return MOCK_LISTINGS.map((l, i) => ({
    id: l.id,
    card_id: l.card_id,
    sku: l.sku,
    variant: l.variant,
    condition: l.condition ?? null,
    grading_company: l.grading_company ?? null,
    grade: l.grade ?? null,
    price_gbp: l.price_gbp,
    cost_basis_gbp: l.cost_basis_gbp,
    qty_in_stock: l.qty_in_stock,
    qty_reserved: l.qty_reserved,
    status: l.status,
    is_featured: l.is_featured,
    featured_priority: l.featured_priority,
    condition_notes: l.condition_notes,
    created_at: ago(30 - i * 2),
    updated_at: ago(Math.max(0, 10 - i)),
  }));
}

/* ─── Orders ────────────────────────────────────────────────────── */

const SHIPPING_COST: Record<ShippingMethodOption, number> = {
  royal_mail_tracked: 4.95,
  royal_mail_special: 9.95,
};

type OrderSeed = {
  n: number;
  buyer: string;
  status: ShopOrderStatus;
  daysAgo: number;
  lines: Array<[listingId: string, qty: number]>;
  shipping: ShippingMethodOption;
  payment: PaymentMethod;
  address: { line1: string; city: string };
  tracking?: string;
  binderOptIn?: boolean;
  note?: string;
};

const ORDER_SEEDS: OrderSeed[] = [
  {
    n: 31, buyer: "sample-user-10", status: "pending_payment", daysAgo: 0.08,
    lines: [["lst-007", 1]], shipping: "royal_mail_tracked", payment: "paypal_in",
    address: { line1: "14 Leith Walk", city: "Edinburgh" },
  },
  {
    n: 30, buyer: "sample-user-11", status: "paid", daysAgo: 0.2,
    lines: [["lst-004", 1]], shipping: "royal_mail_special", payment: "stripe_card",
    address: { line1: "3 Lenton Boulevard", city: "Nottingham" }, binderOptIn: true,
  },
  {
    n: 29, buyer: "sample-user-04", status: "paid", daysAgo: 0.9,
    lines: [["lst-009", 1], ["lst-010", 4]], shipping: "royal_mail_tracked",
    payment: "stripe_card", address: { line1: "22 Malone Road", city: "Belfast" },
  },
  {
    n: 28, buyer: "sample-user-05", status: "packing", daysAgo: 1.3,
    lines: [["lst-008", 1]], shipping: "royal_mail_special", payment: "stripe_card",
    address: { line1: "9 Wilmslow Road", city: "Manchester" }, binderOptIn: true,
  },
  {
    n: 27, buyer: "sample-user-02", status: "shipped", daysAgo: 3,
    lines: [["lst-006", 1]], shipping: "royal_mail_tracked", payment: "paypal_in",
    address: { line1: "41 Headingley Lane", city: "Leeds" }, tracking: "TT482915736GB",
  },
  {
    n: 26, buyer: "sample-user-09", status: "shipped", daysAgo: 4,
    lines: [["lst-005", 1]], shipping: "royal_mail_special", payment: "stripe_card",
    address: { line1: "7 Walter Road", city: "Swansea" }, tracking: "AB120934475GB",
    binderOptIn: true,
  },
  {
    n: 25, buyer: "sample-user-06", status: "delivered", daysAgo: 7,
    lines: [["lst-003", 1]], shipping: "royal_mail_special", payment: "stripe_card",
    address: { line1: "18 North Street", city: "Bristol" }, tracking: "AB118220431GB",
    binderOptIn: true,
  },
  {
    n: 24, buyer: "sample-user-13", status: "delivered", daysAgo: 10,
    lines: [["lst-010", 10], ["lst-007", 1]], shipping: "royal_mail_tracked",
    payment: "paypal_in", address: { line1: "55 Allerton Road", city: "Liverpool" },
    tracking: "TT471103928GB",
  },
  {
    n: 23, buyer: "sample-user-03", status: "cancelled", daysAgo: 12,
    lines: [["lst-012", 1]], shipping: "royal_mail_special", payment: "stripe_card",
    address: { line1: "2 Cathedral Road", city: "Cardiff" },
    note: "Buyer asked to cancel before dispatch — refunded in full.",
  },
  {
    n: 22, buyer: "sample-user-08", status: "delivered", daysAgo: 16,
    lines: [["lst-007", 2]], shipping: "royal_mail_tracked", payment: "stripe_card",
    address: { line1: "120 Stratford Road", city: "Birmingham" },
    tracking: "TT460017734GB",
  },
];

function buildOrder(seed: OrderSeed): { order: LewisOrder; items: LewisOrderItem[] } {
  const id = `sample-order-${seed.n}`;
  const placedAt = ago(seed.daysAgo);
  const listings = sampleListings();
  const items: LewisOrderItem[] = seed.lines.map(([listingId, qty], i) => {
    const l = listings.find((x) => x.id === listingId);
    if (!l) throw new Error(`admin-sample: unknown listing ${listingId}`);
    return {
      id: `${id}-item-${i + 1}`,
      order_id: id,
      listing_id: l.id,
      card_id: l.card_id,
      card_name: cardName(l.card_id),
      set_name: sampleSetName(l.card_id),
      variant: l.variant,
      condition: l.condition,
      grading_company: l.grading_company,
      grade: l.grade,
      qty,
      unit_price_gbp: l.price_gbp,
      line_total_gbp: Math.round(l.price_gbp * qty * 100) / 100,
      created_at: placedAt,
    };
  });
  const subtotal =
    Math.round(items.reduce((s, i) => s + i.line_total_gbp, 0) * 100) / 100;
  const shipping = SHIPPING_COST[seed.shipping];
  const buyer = userById(seed.buyer);
  const after = (s: ShopOrderStatus[]) => s.includes(seed.status);
  const postcode = buyer.postcode ?? "";
  return {
    order: {
      id,
      reference: `CB-ORD-2026-${String(seed.n).padStart(6, "0")}`,
      buyer_id: buyer.id,
      buyer_email: buyer.email,
      buyer_name: buyer.full_name ?? buyer.email,
      status: seed.status,
      subtotal_gbp: subtotal,
      shipping_gbp: shipping,
      total_gbp: Math.round((subtotal + shipping) * 100) / 100,
      payment_method: seed.payment,
      shipping_method: seed.shipping,
      shipping_address: {
        line1: seed.address.line1,
        line2: null,
        city: seed.address.city,
        postcode,
        country: "United Kingdom",
      },
      tracking_number: seed.tracking ?? null,
      add_to_binder_opt_in: seed.binderOptIn ?? false,
      binder_entries_created_at:
        seed.binderOptIn && seed.status === "delivered"
          ? ago(Math.max(0, seed.daysAgo - 2))
          : null,
      placed_at: placedAt,
      paid_at: after(["paid", "packing", "shipped", "delivered", "refunded"])
        ? ago(seed.daysAgo, -0.1)
        : null,
      shipped_at: after(["shipped", "delivered"]) ? ago(Math.max(0, seed.daysAgo - 1)) : null,
      delivered_at: after(["delivered"]) ? ago(Math.max(0, seed.daysAgo - 2)) : null,
      cancelled_at: after(["cancelled"]) ? ago(seed.daysAgo, -3) : null,
      notes_internal: seed.note ?? null,
      notes_buyer: null,
      created_at: placedAt,
      updated_at: placedAt,
    },
    items,
  };
}

export function sampleOrders(): Array<{ order: LewisOrder; items: LewisOrderItem[] }> {
  return ORDER_SEEDS.map(buildOrder);
}

/* ─── Wishlist demand ───────────────────────────────────────────── */

type WishSeed = [cardId: string, userId: string, target: number | null, daysAgo: number];

const WISH_SEEDS: WishSeed[] = [
  ["base1-4", "sample-user-03", 450, 20],
  ["base1-4", "sample-user-09", 400, 14],
  ["base1-4", "sample-user-13", 340, 9],
  ["base1-4", "sample-user-10", null, 6],
  ["base1-4", "sample-user-06", 300, 3],
  ["sv3pt5-199", "sample-user-07", 320, 18],
  ["sv3pt5-199", "sample-user-11", 280, 11],
  ["sv3pt5-199", "sample-user-02", null, 7],
  ["sv3pt5-199", "sample-user-05", 300, 2],
  ["swsh7-215", "sample-user-04", 520, 15],
  ["swsh7-215", "sample-user-12", 480, 10],
  ["swsh7-215", "sample-user-08", null, 4],
  ["base1-2", "sample-user-05", 160, 22],
  ["base1-2", "sample-user-12", 180, 12],
  ["base1-2", "sample-user-02", null, 5],
  ["base3-15", "sample-user-06", 1200, 13],
  ["base3-15", "sample-user-03", null, 8],
  ["neo1-9", "sample-user-10", 260, 16],
  ["neo1-9", "sample-user-09", 220, 6],
  ["base5-4", "sample-user-11", 500, 9],
  ["base5-4", "sample-user-07", 450, 4],
  ["base2-6", "sample-user-08", null, 5],
  ["base1-58", "sample-user-13", 8, 3],
  ["base1-58", "sample-user-04", null, 2],
  ["sv8-238", "sample-user-02", 150, 1],
];

export function sampleWishlist(): Array<{
  user_id: string;
  card_id: string;
  target_price_gbp: number | null;
  created_at: string;
}> {
  return WISH_SEEDS.map(([card_id, user_id, target, days]) => ({
    user_id,
    card_id,
    target_price_gbp: target,
    created_at: ago(days),
  }));
}

/* ─── Binder holders (sourcing) ─────────────────────────────────── */

export type SampleBinderRow = {
  user_id: string;
  variant: "raw" | "graded";
  condition: string | null;
  grading_company: string | null;
  grade: string | null;
  quantity: number;
  is_grail: boolean;
  acquired_at: string;
  source: string;
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Collectors whose binders hold `cardId`. Deterministic per card so the
 * sourcing view always has a plausible answer for any card searched.
 */
export function sampleHoldersOf(cardId: string): SampleBinderRow[] {
  const h = hash(cardId);
  const count = 1 + (h % 4);
  const sellers = USER_SEEDS.filter((u) => u[5] !== "admin");
  const conds = ["NM", "NM", "LP", "MP"];
  const rows: SampleBinderRow[] = [];
  for (let i = 0; i < count; i++) {
    const user = sellers[(h >>> (i * 3)) % sellers.length];
    if (rows.some((r) => r.user_id === user[0])) continue;
    const graded = ((h >>> (i + 5)) & 3) === 0;
    rows.push({
      user_id: user[0],
      variant: graded ? "graded" : "raw",
      condition: graded ? null : conds[(h >>> (i + 2)) % conds.length],
      grading_company: graded ? "PSA" : null,
      grade: graded ? (((h >>> i) & 1) === 0 ? "9" : "10") : null,
      quantity: 1 + ((h >>> (i + 7)) % 2),
      is_grail: ((h >>> (i + 9)) & 7) === 0,
      acquired_at: ago(5 + ((h >>> (i + 4)) % 200)),
      source: i === 0 && ((h >>> 12) & 1) === 0 ? "shop_order" : "manual",
    });
  }
  return rows.sort((a, b) => Number(b.is_grail) - Number(a.is_grail));
}

/* ─── Pricing config ────────────────────────────────────────────── */

export function sampleMarginRow(): LewisAdminMargins {
  return {
    id: "sample-margins",
    global_margin: 0.55,
    min_buy_price: 0.5,
    confidence_threshold: 3,
    condition_multipliers: { NM: 1.0, LP: 0.85, MP: 0.65, HP: 0.45, DMG: 0.25 },
    grade_multipliers: {
      PSA: { "10": 1.0, "9": 0.6, "8": 0.35, "7": 0.2 },
      CGC: { "10": 0.95, "9.5": 0.7, "9": 0.5, "8.5": 0.3 },
      BGS: { "10": 1.0, "9.5": 0.75, "9": 0.5 },
      SGC: { "10": 0.85, "9": 0.5, "8": 0.3 },
      ACE: { "10": 0.9, "9": 0.55 },
    },
    set_overrides: [
      { set_id: "base1", set_name: "Base", margin: 0.62, active: true },
      { set_id: "sv3pt5", set_name: "151", margin: 0.6, active: true },
      { set_id: "swsh7", set_name: "Evolving Skies", margin: 0.58, active: false },
    ],
    rarity_overrides: [
      { rarity: "Common", margin: 0.3, active: true },
      { rarity: "Special Illustration Rare", margin: 0.62, active: true },
    ],
    fx_rate_usd_gbp: 0.7468,
    fx_rate_eur_gbp: 0.8412,
    fx_rate_updated_at: nightly(0, 2, 0),
    fx_manual_override: false,
    created_at: ago(3, 5),
    created_by: "sample-user-01",
    change_note: "Raised Base Set margin for the Charizard push",
  };
}

/* ─── Price sync ────────────────────────────────────────────────── */

export function sampleCoverage(): {
  totalCards: number;
  withPrices: number;
  lastSyncAt: string | null;
} {
  const totalCards = getAllCards().length;
  return {
    totalCards,
    withPrices: Math.round(totalCards * 0.947),
    lastSyncAt: nightly(0, 4, 3),
  };
}

export function sampleSyncRuns(limit: number): SyncRunSummary[] {
  const runs: SyncRunSummary[] = [];
  const total = getAllCards().length;
  for (let d = 0; d < 10; d++) {
    const pStart = nightly(d, 4, 0);
    const partial = d === 3;
    runs.push({
      id: `sample-run-prices-${d}`,
      kind: "prices",
      source: "tcgcsv",
      started_at: pStart,
      finished_at: new Date(new Date(pStart).getTime() + (182 + d * 7) * 1000).toISOString(),
      status: partial ? "partial" : "success",
      sets_processed: partial ? 170 : 172,
      cards_upserted: partial ? total - 214 : total - (d % 3) * 12,
      prices_upserted: Math.round(total * 1.62) - d * 31,
      errors: partial
        ? [
            { group: "Celebrations: Classic Collection", reason: "HTTP 503 from upstream — retried 3×" },
            { group: "Detective Pikachu", reason: "Timed out after 30s" },
          ]
        : [],
      notes: null,
    });
    const fStart = nightly(d, 2, 0);
    runs.push({
      id: `sample-run-fx-${d}`,
      kind: "fx",
      source: "open.er-api.com",
      started_at: fStart,
      finished_at: new Date(new Date(fStart).getTime() + 1400).toISOString(),
      status: "success",
      sets_processed: 0,
      cards_upserted: 0,
      prices_upserted: 0,
      errors: [],
      notes: null,
    });
  }
  return runs
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .slice(0, limit);
}

/* ─── TCGCSV mapping + price previews ───────────────────────────── */

export const SAMPLE_MAPPING_SETS: Array<{ setId: string; tcgName: string; groupId: number }> = [
  { setId: "base1", tcgName: "Base Set", groupId: 604 },
  { setId: "base2", tcgName: "Jungle", groupId: 635 },
  { setId: "base3", tcgName: "Fossil", groupId: 630 },
  { setId: "base4", tcgName: "Base Set 2", groupId: 605 },
  { setId: "base5", tcgName: "Team Rocket", groupId: 1373 },
  { setId: "basep", tcgName: "WoTC Promo", groupId: 1418 },
];

/** A believable mapping report: nearly everything exact, a few flags. */
export function sampleMapping(setId: string, groupId: number): MappingResult {
  const cards = getCardsBySet(setId);
  const result: MappingResult = {
    setId,
    matched: [],
    ambiguous: [],
    unmatched: [],
    orphans: [],
  };
  cards.forEach((c, i) => {
    const productId = groupId * 1000 + i + 1;
    if (setId === "basep" && i >= cards.length - 2) {
      result.unmatched.push({
        cardId: c.id,
        cardName: c.name,
        cardNumber: c.number,
        rarity: c.rarity,
        reason: "No TCGplayer product with this promo number",
      });
      return;
    }
    if (setId === "base1" && c.name === "Machamp") {
      result.matched.push({
        cardId: c.id,
        cardName: c.name,
        cardNumber: c.number,
        rarity: c.rarity,
        productId,
        productName: "Machamp (1st Edition)",
        productNumber: c.number,
        productRarity: c.rarity ?? null,
        confidence: "number-only",
        notes: ["Only listed as 1st Edition (deck exclusive)"],
      });
      return;
    }
    result.matched.push({
      cardId: c.id,
      cardName: c.name,
      cardNumber: c.number,
      rarity: c.rarity,
      productId,
      productName: c.name,
      productNumber: c.number,
      productRarity: c.rarity ?? null,
      confidence: "exact",
      notes: [],
    });
  });
  if (setId === "base1" || setId === "base2" || setId === "base3") {
    result.orphans.push(
      {
        productId: groupId * 1000 + 900,
        productName: `${SAMPLE_MAPPING_SETS.find((s) => s.setId === setId)?.tcgName} Booster Pack`,
        productNumber: null,
        reason: "Sealed product — not a card",
      },
      {
        productId: groupId * 1000 + 901,
        productName: `${SAMPLE_MAPPING_SETS.find((s) => s.setId === setId)?.tcgName} Booster Box`,
        productNumber: null,
        reason: "Sealed product — not a card",
      },
    );
  }
  return result;
}

export function sampleTcgPreview(): {
  groups: Record<string, number | null>;
  products: TcgProduct[];
  prices: TcgPrice[];
} {
  const groups: Record<string, number | null> = {};
  for (const s of SAMPLE_MAPPING_SETS) groups[s.setId] = s.groupId;
  const cards = getCardsBySet("base1");
  const products: TcgProduct[] = cards.map((c, i) => ({
    productId: 604000 + i + 1,
    name: c.name,
    cleanName: c.name,
    imageUrl: c.images.small,
    categoryId: 3,
    groupId: 604,
    url: "",
    modifiedOn: nightly(1, 4, 0),
    imageCount: 1,
    extendedData: [
      { name: "Number", displayName: "Card Number", value: c.number },
      { name: "Rarity", displayName: "Rarity", value: c.rarity ?? "Promo" },
    ],
  }));
  const prices: TcgPrice[] = cards.map((c, i) => {
    const nm = getMockCardById(c.id)?.raw_prices.NM;
    const market = nm?.market ?? null;
    return {
      productId: 604000 + i + 1,
      lowPrice: nm?.low ?? null,
      midPrice: market !== null ? Math.round(market * 1.04 * 100) / 100 : null,
      highPrice: nm?.high ?? null,
      marketPrice: market,
      directLowPrice: null,
      subTypeName: c.rarity === "Rare Holo" ? "Holofoil" : "Normal",
    };
  });
  return { groups, products, prices };
}
