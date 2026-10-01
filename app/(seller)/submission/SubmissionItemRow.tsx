"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Form";
import { TR, TD } from "@/components/ui/Table";
import { CardImage } from "@/components/cardbuy/CardImage";
import { formatGBP } from "@/lib/mock/mock-offer";
import {
  removeSubmissionItem,
  updateSubmissionItemQuantity,
} from "@/app/_actions/submission";
import { isPreviewError } from "@/lib/mock/preview-actions";
import type { LewisSubmissionItem } from "@/lib/supabase/types";

type Props = {
  item: LewisSubmissionItem;
  cardName: string;
  setName: string;
  rarity: string | null;
  imageUrl: string | null;
};

export function SubmissionItemRow({
  item,
  cardName,
  setName,
  rarity,
  imageUrl,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setQty(q: number) {
    setError(null);
    startTransition(async () => {
      const r = await updateSubmissionItemQuantity(item.id, q);
      if (isPreviewError(r)) setError(r.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const r = await removeSubmissionItem(item.id);
      if (isPreviewError(r)) setError(r.error);
    });
  }

  return (
    <TR>
      <TD>
        <div className="flex gap-3 items-start">
          <Link href={`/card/${item.card_id}`} className="shrink-0 hidden sm:block">
            <CardImage
              src={imageUrl}
              alt={cardName}
              size="sm"
              rarity={rarity}
              hideBadge
              static
            />
          </Link>
          <div className="flex flex-col gap-0.5 min-w-0">
            <Link
              href={`/card/${item.card_id}`}
              className="font-display text-[13px] leading-tight tracking-tight line-clamp-2 hover:text-brand"
            >
              {cardName}
            </Link>
            <span className="text-[11px] text-muted truncate">{setName}</span>
            {/* Variant + remove live in this cell on phones (their own
                columns are hidden below sm). */}
            <span className="sm:hidden font-display text-[10px] tracking-wider uppercase mt-1">
              {item.variant === "raw"
              ? `Raw · ${item.condition}`
              : `Graded · ${item.grading_company} ${item.grade}`}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className="sm:hidden w-fit mt-1 text-[11px] underline underline-offset-2 text-secondary hover:text-warn disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      </TD>
      <TD className="hidden sm:table-cell">
        <span className="font-display text-[11px] tracking-wider uppercase">
          {item.variant === "raw"
            ? `Raw · ${item.condition}`
            : `Graded · ${item.grading_company} ${item.grade}`}
        </span>
      </TD>
      <TD>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => setQty(item.quantity - 1)}
          >
            −
          </Button>
          <span className="font-display text-[14px] min-w-8 text-center tabular-nums">
            {item.quantity}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() => setQty(item.quantity + 1)}
          >
            +
          </Button>
        </div>
        {error ? (
          <span role="alert" className="text-[10px] text-warn mt-1 block max-w-[22ch]">
            {error}
          </span>
        ) : null}
      </TD>
      <TD className="hidden md:table-cell text-right tabular-nums">
        {formatGBP(Number(item.offered_amount_per))}
      </TD>
      <TD className="text-right tabular-nums font-display">
        {formatGBP(Number(item.offered_amount_total))}
      </TD>
      <TD className="hidden sm:table-cell">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={remove}
        >
          Remove
        </Button>
      </TD>
    </TR>
  );
}
