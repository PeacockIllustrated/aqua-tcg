import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listAdminListings } from "@/app/_actions/admin-shop";
import { getCardsBySet, getSetById } from "@/lib/fixtures/cards";
import { FEATURED_SLOT_COUNT } from "@/lib/mock/mock-listings";
import { InventoryEditor, type CardOption } from "./InventoryEditor";

export const metadata = { title: "Inventory" };

export const dynamic = "force-dynamic";

/** Sets offered in the "Add listing" card picker. Any valid card id can
 *  still be typed in by hand. */
const PICKER_SETS = ["base1", "base2", "base3", "base4", "base5", "basep", "neo1", "sv3pt5", "swsh7", "sv8"];

function cardOptions(): CardOption[] {
  return PICKER_SETS.flatMap((setId) => {
    const setName = getSetById(setId)?.name ?? setId;
    return getCardsBySet(setId).map((c) => ({
      id: c.id,
      label: `${c.name} · ${setName} #${c.number}`,
    }));
  });
}

/**
 * Server component — loads every listing (sample listings in preview
 * mode) and hands plain data to the client editor, which saves each
 * change through the admin-shop server actions.
 */
export default async function AdminInventoryPage() {
  const listings = await listAdminListings("all");
  const activeCount = listings.filter((l) => l.status === "active").length;
  return (
    <div className="px-4 md:px-6 py-6 max-w-[1400px] mx-auto flex flex-col gap-6">
      <AdminPageHeader
        crumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Sell side" },
          { label: "Inventory" },
        ]}
        title="Inventory & listings"
        kicker={{ label: "SELL", tone: "brand" }}
        subtitle="Every physical stock unit on the shopfront — set prices, toggle featured, flag sold."
        actions={
          <span className="font-display text-[11px] tracking-wider tabular-nums text-muted">
            {activeCount} active · {listings.length} total
          </span>
        }
      />

      <InventoryEditor
        initial={listings}
        featuredSlotCount={FEATURED_SLOT_COUNT}
        cardOptions={cardOptions()}
      />
    </div>
  );
}
