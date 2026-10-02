"use client";

import { useMemo, useState, useTransition } from "react";
import { Annotation } from "@/components/wireframe/Annotation";
import { Button, Select } from "@/components/ui/Form";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { formatGBP } from "@/lib/mock/mock-offer";
import { revisedOfferPer } from "@/lib/mock/admin-offer-revision";
import { updateSubmissionStatus } from "@/app/admin/submissions/actions";
import type {
  ConditionMultipliers,
  ItemCondition,
  SubmissionStatus,
} from "@/lib/supabase/types";

const CONDITIONS: ItemCondition[] = ["NM", "LP", "MP", "HP", "DMG"];

export type ReviewItem = {
  id: string;
  card_name: string;
  set_name: string;
  variant: "raw" | "graded";
  condition: ItemCondition | null;
  grading_company: string | null;
  grade: string | null;
  quantity: number;
  offered_amount_per: number;
  verified_condition: ItemCondition | null;
};

const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Draft",
  submitted: "Awaiting cards",
  awaiting_cards: "Awaiting cards",
  received: "Received",
  under_review: "Under review",
  offer_revised: "Offer sent",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
  returned: "Returned",
  cancelled: "Cancelled",
};

type Action = {
  to: SubmissionStatus;
  label: string;
  variant: "primary" | "secondary" | "danger";
};

function actionsFor(status: SubmissionStatus, hasRevision: boolean): Action[] {
  switch (status) {
    case "submitted":
    case "awaiting_cards":
      return [
        { to: "received", label: "Mark received", variant: "primary" },
        { to: "cancelled", label: "Cancel", variant: "danger" },
      ];
    case "received":
      return [
        { to: "under_review", label: "Start review", variant: "primary" },
        { to: "rejected", label: "Reject & return", variant: "danger" },
      ];
    case "under_review":
      return hasRevision
        ? [
            { to: "offer_revised", label: "Send revised offer", variant: "primary" },
            { to: "rejected", label: "Reject & return", variant: "danger" },
          ]
        : [
            { to: "paid", label: "Approve & pay", variant: "primary" },
            { to: "rejected", label: "Reject & return", variant: "danger" },
          ];
    case "offer_revised":
      return [
        { to: "paid", label: "Seller accepted · pay", variant: "primary" },
        { to: "rejected", label: "Seller declined · return", variant: "danger" },
      ];
    case "approved":
      return [{ to: "paid", label: "Mark paid", variant: "primary" }];
    case "rejected":
      return [{ to: "returned", label: "Mark returned", variant: "secondary" }];
    default:
      return [];
  }
}

/**
 * Admin review of one buylist submission: verify each card's condition
 * on arrival (re-pricing the line live), then move the submission along
 * the pipeline. In preview mode the transitions apply locally only and
 * a notice says nothing was saved.
 */
export function SubmissionReview({
  submissionId,
  initialStatus,
  totalOffered,
  totalPaid,
  items,
  conditionMultipliers,
}: {
  submissionId: string;
  initialStatus: SubmissionStatus;
  totalOffered: number;
  totalPaid: number | null;
  items: ReviewItem[];
  conditionMultipliers: ConditionMultipliers;
}) {
  const [status, setStatus] = useState<SubmissionStatus>(initialStatus);
  const [paid, setPaid] = useState<number | null>(totalPaid);
  const [verified, setVerified] = useState<Record<string, ItemCondition | "">>(
    Object.fromEntries(items.map((i) => [i.id, i.verified_condition ?? ""])),
  );
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(
    null,
  );

  const editable = ["received", "under_review"].includes(status);

  const lines = useMemo(
    () =>
      items.map((item) => {
        const v = verified[item.id];
        const revisedPer =
          v && item.variant === "raw" && item.condition
            ? revisedOfferPer(item.offered_amount_per, item.condition, v, conditionMultipliers)
            : item.offered_amount_per;
        return {
          ...item,
          verified: v,
          revisedPer,
          revisedTotal: Math.round(revisedPer * item.quantity * 100) / 100,
        };
      }),
    [items, verified, conditionMultipliers],
  );

  const adjustedTotal =
    Math.round(lines.reduce((s, l) => s + l.revisedTotal, 0) * 100) / 100;
  const delta = Math.round((adjustedTotal - totalOffered) * 100) / 100;
  const actions = actionsFor(status, delta !== 0);

  function transition(to: SubmissionStatus) {
    if (pending) return;
    setNotice(null);
    start(async () => {
      const res = await updateSubmissionStatus(submissionId, to, verified);
      if (res.ok) {
        setStatus(to);
        if (res.totalPaid !== undefined) setPaid(res.totalPaid);
        return;
      }
      if (res.preview) {
        // Show what would have happened, but say it wasn't saved.
        setStatus(to);
        if (to === "paid") setPaid(adjustedTotal);
        setNotice({ tone: "info", text: res.error });
        return;
      }
      setNotice({ tone: "error", text: res.error });
    });
  }

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[1fr_260px] gap-6 items-start">
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <Annotation>CARDS · verify on arrival</Annotation>
          <span className="font-display text-[11px] tracking-wider uppercase border-2 border-ink rounded-sm px-2 py-0.5 bg-paper-strong">
            {SUBMISSION_STATUS_LABELS[status]}
          </span>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Card</TH>
              <TH>Declared</TH>
              <TH>Verified</TH>
              <TH>Qty</TH>
              <TH className="text-right">Per</TH>
              <TH className="text-right">Line</TH>
            </TR>
          </THead>
          <TBody>
            {lines.map((l) => (
              <TR key={l.id}>
                <TD>
                  <div className="text-[13px] font-display tracking-tight">{l.card_name}</div>
                  <div className="text-[11px] text-muted">{l.set_name}</div>
                </TD>
                <TD className="text-[12px] whitespace-nowrap">
                  {l.variant === "raw"
                    ? `Raw · ${l.condition}`
                    : `${l.grading_company} ${l.grade}`}
                </TD>
                <TD>
                  {l.variant === "raw" ? (
                    <Select
                      aria-label={`Verified condition for ${l.card_name}`}
                      value={l.verified ?? ""}
                      disabled={!editable || pending}
                      onChange={(e) =>
                        setVerified((prev) => ({
                          ...prev,
                          [l.id]: e.target.value as ItemCondition | "",
                        }))
                      }
                    >
                      <option value="">As declared</option>
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <span className="text-[11px] text-muted">Slab checked</span>
                  )}
                </TD>
                <TD className="tabular-nums">{l.quantity}</TD>
                <TD className="text-right tabular-nums">
                  {formatGBP(l.revisedPer)}
                  {l.revisedPer !== l.offered_amount_per ? (
                    <div className="text-[11px] text-warn">
                      was {formatGBP(l.offered_amount_per)}
                    </div>
                  ) : null}
                </TD>
                <TD className="text-right tabular-nums">{formatGBP(l.revisedTotal)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <Button
                key={a.to}
                size="sm"
                variant={a.variant}
                disabled={pending}
                onClick={() => transition(a.to)}
              >
                {a.label}
              </Button>
            ))}
            {pending ? (
              <span className="self-center font-display text-[10px] tracking-wider text-muted">
                Saving…
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-[12px] text-muted">
            This submission is closed — no further actions.
          </p>
        )}

        {notice ? (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`rounded-md px-3 py-2 text-[12px] border-2 ${
              notice.tone === "error"
                ? "bg-warn/10 border-warn text-warn"
                : "bg-highlight/30 border-ink text-ink"
            }`}
          >
            {notice.text}
          </div>
        ) : null}
      </div>

      <aside className="pop-card rounded-md p-4 flex flex-col gap-3 2xl:sticky 2xl:top-2 max-w-[420px]">
        <Annotation>RUNNING TOTAL</Annotation>
        <div className="flex justify-between text-[12px]">
          <span className="text-secondary">Original offer</span>
          <span className="tabular-nums">{formatGBP(totalOffered)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-secondary">After verification</span>
          <span className="tabular-nums">{formatGBP(adjustedTotal)}</span>
        </div>
        <div className="border-t-2 border-ink/15 pt-3 flex justify-between items-baseline">
          <span className="text-[11px] uppercase tracking-wider text-secondary font-display">
            Difference
          </span>
          <span
            className={`font-display text-[20px] tabular-nums ${
              delta < 0 ? "text-warn" : delta > 0 ? "text-ink" : "text-muted"
            }`}
          >
            {delta >= 0 ? "+" : "−"}
            {formatGBP(Math.abs(delta))}
          </span>
        </div>
        {paid !== null ? (
          <div className="flex justify-between text-[12px] border-t-2 border-ink/15 pt-3">
            <span className="text-secondary font-display uppercase tracking-wider text-[11px]">
              Paid out
            </span>
            <span className="font-display tabular-nums">{formatGBP(paid)}</span>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
