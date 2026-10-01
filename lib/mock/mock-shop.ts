import "server-only";
import { getCardById } from "@/lib/fixtures/cards";
import { MOCK_LISTINGS } from "./mock-listings";
import type { MockListing } from "./types";
import type {
  LewisListing,
  LewisOrder,
  LewisOrderItem,
} from "@/lib/supabase/types";

/* ─────────────────────────────────────────────────────────────────
 * Shop sample data in the DB row shapes (`LewisListing`, `LewisOrder`)
 * so the shop actions can hand it to the same adapters and pages the
 * live data goes through. Used when Supabase isn't configured (or a
 * listings query fails), and for the signed-out order preview.
 * ───────────────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000;

/** A few listings get a recent `created_at` so the "New in" badges and
 *  the "Newest" sort have something to show in the demo. */
const RECENT_DAYS_AGO: Record<string, number> = {
  "lst-013": 2,
  "lst-008": 4,
  "lst-009": 6,
  "lst-006": 9,
};

function toLewisListing(m: MockListing): LewisListing {
  const daysAgo = RECENT_DAYS_AGO[m.id];
  const createdAt =
    daysAgo !== undefined
      ? new Date(Date.now() - daysAgo * DAY_MS).toISOString()
      : m.created_at;
  return {
    id: m.id,
    card_id: m.card_id,
    sku: m.sku,
    variant: m.variant,
    condition: m.condition ?? null,
    grading_company: m.grading_company ?? null,
    grade: m.grade ?? null,
    price_gbp: m.price_gbp,
    cost_basis_gbp: m.cost_basis_gbp,
    qty_in_stock: m.qty_in_stock,
    qty_reserved: m.qty_reserved,
    status: m.status,
    is_featured: m.is_featured,
    featured_priority: m.featured_priority,
    condition_notes: m.condition_notes,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

export function getMockLewisListings(): LewisListing[] {
  return MOCK_LISTINGS.map(toLewisListing);
}

export function getMockLewisListing(id: string): LewisListing | null {
  const m = MOCK_LISTINGS.find((l) => l.id === id);
  return m ? toLewisListing(m) : null;
}

/* ─── sample order ─────────────────────────────────────────────── */

export const SAMPLE_ORDER_REFERENCE = "CB-2026-000042";

const SAMPLE_ORDER_LINES: Array<{ listingId: string; qty: number }> = [
  { listingId: "lst-004", qty: 1 },
  { listingId: "lst-007", qty: 2 },
  { listingId: "lst-010", qty: 4 },
];

const SET_NAMES: Record<string, string> = {
  base1: "Base Set",
  base2: "Jungle",
  base3: "Fossil",
  base4: "Base Set 2",
  base5: "Team Rocket",
  basep: "Wizards Black Star Promos",
};

/**
 * A plausible order for any reference, so `/shop/order/<ref>` renders
 * in preview whatever ref the visitor lands on (including the one the
 * preview checkout redirects to).
 */
export function getSampleOrder(reference: string): {
  order: LewisOrder;
  items: LewisOrderItem[];
} {
  const placedAt = new Date(Date.now() - 20 * 60_000).toISOString();
  const orderId = "preview-order";

  const items: LewisOrderItem[] = SAMPLE_ORDER_LINES.flatMap((line, i) => {
    const l = MOCK_LISTINGS.find((x) => x.id === line.listingId);
    if (!l) return [];
    const card = getCardById(l.card_id);
    const setId = l.card_id.split("-")[0];
    return [
      {
        id: `preview-item-${i + 1}`,
        order_id: orderId,
        listing_id: l.id,
        card_id: l.card_id,
        card_name: card?.name ?? l.card_name,
        set_name: SET_NAMES[setId] ?? l.set_name,
        variant: l.variant,
        condition: l.condition ?? null,
        grading_company: l.grading_company ?? null,
        grade: l.grade ?? null,
        qty: line.qty,
        unit_price_gbp: l.price_gbp,
        line_total_gbp: +(l.price_gbp * line.qty).toFixed(2),
        created_at: placedAt,
      },
    ];
  });

  const subtotal = +items
    .reduce((s, it) => s + it.line_total_gbp, 0)
    .toFixed(2);
  // Mirrors the cart rule: free Royal Mail Tracked over £250.
  const shipping = subtotal >= 250 ? 0 : 4.95;

  const order: LewisOrder = {
    id: orderId,
    reference,
    buyer_id: null,
    buyer_email: "sam.collector@example.com",
    buyer_name: "Sam Collector",
    status: "pending_payment",
    subtotal_gbp: subtotal,
    shipping_gbp: shipping,
    total_gbp: +(subtotal + shipping).toFixed(2),
    payment_method: "stub",
    shipping_method: "royal_mail_tracked",
    shipping_address: {
      line1: "14 Larch Avenue",
      line2: null,
      city: "Leeds",
      postcode: "LS6 2QT",
      country: "GB",
    },
    tracking_number: null,
    add_to_binder_opt_in: true,
    binder_entries_created_at: null,
    placed_at: placedAt,
    paid_at: null,
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    notes_internal: null,
    notes_buyer: null,
    created_at: placedAt,
    updated_at: placedAt,
  };

  return { order, items };
}
