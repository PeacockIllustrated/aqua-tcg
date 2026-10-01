"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui/Form";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { formatGBP } from "@/lib/mock/mock-offer";
import {
  createListing,
  updateListing,
  type AdminListingRow,
  type UpdateListingInput,
} from "@/app/_actions/admin-shop";
import type {
  Grade,
  GradingCompany,
  ItemCondition,
  ListingStatus,
} from "@/lib/supabase/types";

type Tab = "active" | "hidden" | "sold_out" | "featured";
const TABS: Array<{ key: Tab; label: string }> = [
  { key: "active", label: "Active" },
  { key: "featured", label: "Featured" },
  { key: "hidden", label: "Hidden" },
  { key: "sold_out", label: "Sold out" },
];

const CONDITIONS: ItemCondition[] = ["NM", "LP", "MP", "HP", "DMG"];
const COMPANIES: GradingCompany[] = ["PSA", "CGC", "BGS", "SGC", "ACE"];
const GRADES: Grade[] = ["10", "9.5", "9", "8.5", "8", "7"];

export type CardOption = { id: string; label: string };

function marginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

type Notice = { tone: "info" | "error"; text: string } | null;

type Props = {
  initial: AdminListingRow[];
  featuredSlotCount: number;
  cardOptions: CardOption[];
};

/**
 * Inventory table. Every edit is applied on screen immediately and saved
 * through `updateListing` (prices + stock on blur, status + featured on
 * change). In preview mode the edits stay on screen and a notice says
 * they weren't saved.
 */
export function InventoryEditor({ initial, featuredSlotCount, cardOptions }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminListingRow[]>(initial);
  const [tab, setTab] = useState<Tab>("active");
  const [notice, setNotice] = useState<Notice>(null);
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    if (tab === "featured") return rows.filter((r) => r.is_featured);
    return rows.filter((r) => r.status === (tab as ListingStatus));
  }, [rows, tab]);

  const featuredCount = rows.filter((r) => r.is_featured).length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const totalStockValue = rows
    .filter((r) => r.status === "active")
    .reduce((s, r) => s + r.price_gbp * r.qty_in_stock, 0);
  const lowStockCount = rows.filter(
    (r) => r.status === "active" && r.qty_in_stock <= 1,
  ).length;

  function local(id: string, patch: Partial<AdminListingRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function save(id: string, patch: UpdateListingInput) {
    start(async () => {
      const res = await updateListing(id, patch);
      if (res.ok) return;
      setNotice({ tone: res.preview ? "info" : "error", text: res.error });
    });
  }

  function toggleFeatured(listing: AdminListingRow) {
    if (listing.is_featured) {
      local(listing.id, { is_featured: false, featured_priority: null });
      save(listing.id, { isFeatured: false, featuredPriority: null });
      return;
    }
    if (featuredCount >= featuredSlotCount) {
      setNotice({
        tone: "error",
        text: `All ${featuredSlotCount} featured slots are full. Unfeature another listing first.`,
      });
      return;
    }
    const priority = featuredCount + 1;
    local(listing.id, { is_featured: true, featured_priority: priority });
    save(listing.id, { isFeatured: true, featuredPriority: priority });
  }

  return (
    <>
      {/* Stats strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InvStat label="Active listings" value={activeCount} />
        <InvStat
          label="Featured slots"
          value={`${featuredCount} / ${featuredSlotCount}`}
        />
        <InvStat label="Total stock value" value={formatGBP(totalStockValue)} />
        <InvStat
          label="Low-stock alerts"
          value={lowStockCount}
          accent={lowStockCount > 0 ? "warn" : undefined}
        />
      </section>

      {/* Tabs + add */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <nav className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`border-2 rounded-sm px-2.5 py-1 font-display text-[11px] tracking-wider uppercase transition-colors ${
                tab === t.key
                  ? "border-ink bg-ink text-paper-strong"
                  : "border-ink bg-paper-strong text-ink hover:bg-highlight"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "+ Add listing"}
        </Button>
      </div>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-[12px] border-2 ${
            notice.tone === "error"
              ? "bg-warn/10 border-warn text-warn"
              : "bg-highlight/30 border-ink text-ink"
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-display text-[10px] tracking-wider underline underline-offset-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {adding ? (
        <AddListingForm
          cardOptions={cardOptions}
          onDone={(row, message) => {
            if (row) {
              setRows((prev) => [row, ...prev]);
              setTab("active");
            } else {
              router.refresh();
            }
            setNotice(message);
            setAdding(false);
          }}
        />
      ) : null}

      <Table>
        <THead>
          <TR>
            <TH>SKU</TH>
            <TH>Card</TH>
            <TH>Variant</TH>
            <TH>Stock</TH>
            <TH className="text-right">Price (£)</TH>
            <TH className="text-right">Cost</TH>
            <TH>Margin</TH>
            <TH>Status</TH>
            <TH>Featured</TH>
          </TR>
        </THead>
        <TBody>
          {filtered.length === 0 ? (
            <TR>
              <TD colSpan={9} className="text-center text-secondary py-6">
                No listings in this view.
              </TD>
            </TR>
          ) : (
            filtered.map((l) => {
              const margin = marginPct(l.price_gbp, l.cost_basis_gbp);
              return (
                <TR key={l.id}>
                  <TD className="font-mono text-[11px] tabular-nums">{l.sku}</TD>
                  <TD>
                    <Link
                      href={`/shop/${l.id}`}
                      className="font-display text-[13px] tracking-tight underline underline-offset-4 decoration-2 hover:text-brand"
                    >
                      {l.card_name}
                    </Link>
                    <div className="text-[11px] text-muted">{l.set_name}</div>
                  </TD>
                  <TD className="text-[12px] font-display tracking-wider uppercase whitespace-nowrap">
                    {l.variant === "raw"
                      ? `Raw · ${l.condition}`
                      : `${l.grading_company} ${l.grade}`}
                  </TD>
                  <TD>
                    <Input
                      type="number"
                      min={0}
                      aria-label={`Stock for ${l.sku}`}
                      value={l.qty_in_stock}
                      onChange={(e) =>
                        local(l.id, { qty_in_stock: Number(e.target.value) })
                      }
                      onBlur={(e) =>
                        save(l.id, { qtyInStock: Number(e.target.value) })
                      }
                      className="w-20"
                    />
                  </TD>
                  <TD>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      aria-label={`Price for ${l.sku}`}
                      value={l.price_gbp}
                      onChange={(e) =>
                        local(l.id, { price_gbp: Number(e.target.value) })
                      }
                      onBlur={(e) =>
                        save(l.id, { priceGbp: Number(e.target.value) })
                      }
                      className="w-28 text-right tabular-nums"
                    />
                  </TD>
                  <TD className="text-right text-muted tabular-nums">
                    {formatGBP(l.cost_basis_gbp)}
                  </TD>
                  <TD>
                    <span
                      className={`font-display tabular-nums ${
                        margin < 20
                          ? "text-warn"
                          : margin >= 35
                            ? "text-ink"
                            : "text-secondary"
                      }`}
                    >
                      {margin.toFixed(1)}%
                    </span>
                  </TD>
                  <TD>
                    <Select
                      aria-label={`Status for ${l.sku}`}
                      value={l.status}
                      onChange={(e) => {
                        const status = e.target.value as ListingStatus;
                        local(l.id, { status });
                        save(l.id, { status });
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="hidden">Hidden</option>
                      <option value="sold_out">Sold out</option>
                    </Select>
                  </TD>
                  <TD>
                    <label className="flex items-center gap-2 text-[12px] font-display tracking-wider">
                      <input
                        type="checkbox"
                        aria-label={`Feature ${l.sku} on the homepage`}
                        checked={l.is_featured}
                        onChange={() => toggleFeatured(l)}
                      />
                      {l.featured_priority ? `#${l.featured_priority}` : ""}
                    </label>
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </>
  );
}

function AddListingForm({
  cardOptions,
  onDone,
}: {
  cardOptions: CardOption[];
  onDone: (optimisticRow: AdminListingRow | null, notice: Notice) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cardId, setCardId] = useState("");
  const [variant, setVariant] = useState<"raw" | "graded">("raw");
  const [condition, setCondition] = useState<ItemCondition>("NM");
  const [company, setCompany] = useState<GradingCompany>("PSA");
  const [grade, setGrade] = useState<Grade>("10");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [qty, setQty] = useState("1");
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = cardId.trim();
    const input = {
      cardId: id,
      variant,
      condition: variant === "raw" ? condition : undefined,
      gradingCompany: variant === "graded" ? company : undefined,
      grade: variant === "graded" ? grade : undefined,
      priceGbp: Number(price),
      costBasisGbp: Number(cost || 0),
      qtyInStock: Number(qty || 0),
      conditionNotes: notes.trim() || null,
    };
    start(async () => {
      const res = await createListing(input);
      if (res.ok) {
        onDone(null, { tone: "info", text: "Listing added to the shop." });
        return;
      }
      if (res.preview) {
        const label = cardOptions.find((c) => c.id === id)?.label ?? id;
        const [name, setName] = label.split(" · ");
        const variantSuffix =
          variant === "raw" ? condition : `${company}${grade}`;
        const now = new Date().toISOString();
        onDone(
          {
            id: `preview-${Date.now()}`,
            card_id: id,
            sku: `${id.toUpperCase()}-${variantSuffix}-NEW`,
            variant,
            condition: input.condition ?? null,
            grading_company: input.gradingCompany ?? null,
            grade: input.grade ?? null,
            price_gbp: input.priceGbp,
            cost_basis_gbp: input.costBasisGbp,
            qty_in_stock: input.qtyInStock,
            qty_reserved: 0,
            status: "active",
            is_featured: false,
            featured_priority: null,
            condition_notes: input.conditionNotes,
            created_at: now,
            updated_at: now,
            card_name: name ?? id,
            set_name: setName?.replace(/ #.*$/, "") ?? "",
            image_url: null,
            qty_available: input.qtyInStock,
          },
          { tone: "info", text: res.error },
        );
        return;
      }
      setError(res.error);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="pop-card rounded-md p-4 flex flex-col gap-4 bg-paper-strong"
    >
      <div className="font-display text-[13px] tracking-wider uppercase">New listing</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Card" hint="Start typing a name, or paste a card id like base1-4.">
          <Input
            list="inventory-card-options"
            required
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            placeholder="e.g. Charizard"
          />
          <datalist id="inventory-card-options">
            {cardOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </datalist>
        </Field>
        <Field label="Variant">
          <Select
            value={variant}
            onChange={(e) => setVariant(e.target.value as "raw" | "graded")}
          >
            <option value="raw">Raw</option>
            <option value="graded">Graded</option>
          </Select>
        </Field>
        {variant === "raw" ? (
          <Field label="Condition">
            <Select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ItemCondition)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grader">
              <Select
                value={company}
                onChange={(e) => setCompany(e.target.value as GradingCompany)}
              >
                {COMPANIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Grade">
              <Select value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        <Field label="Price (£)">
          <Input
            type="number"
            step={0.01}
            min={0.01}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="Cost basis (£)" hint="What you paid — used for margin.">
          <Input
            type="number"
            step={0.01}
            min={0}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </Field>
        <Field label="Quantity">
          <Input
            type="number"
            min={0}
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Condition notes (optional)">
        <Input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Light whitening on back corners"
        />
      </Field>
      {error ? (
        <div
          role="alert"
          className="bg-warn/10 border-2 border-warn text-warn rounded-md px-3 py-2 text-[12px]"
        >
          {error}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add listing"}
        </Button>
      </div>
    </form>
  );
}

function InvStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "warn";
}) {
  return (
    <div className="border-2 border-ink rounded-md p-3 bg-paper-strong">
      <div className="text-[10px] font-display uppercase tracking-wider text-muted">
        {label}
      </div>
      <div
        className={`font-display text-[22px] leading-tight tracking-tight tabular-nums mt-1 ${
          accent === "warn" ? "text-warn" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
