"use client";

import Link from "next/link";
import { useState } from "react";

export function PaymentsComingSoonModal({
  reference,
  buyerEmail,
  preview = false,
}: {
  reference: string;
  buyerEmail: string;
  /** Pitch demo: explain what a live shop does here instead. */
  preview?: boolean;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={preview ? "Demo checkout" : "Payments coming soon"}
      className="fixed inset-0 z-[100] bg-ink/70 flex items-center justify-center p-4"
    >
      <div className="pop-static bg-paper-strong rounded-md w-full max-w-[480px] flex flex-col gap-3 p-5">
        <div className="font-display text-[10px] tracking-[0.25em] text-muted">
          {preview ? "Demo checkout" : "Payments coming soon"}
        </div>
        <h2 className="font-display text-[22px] leading-tight tracking-tight">
          Your order is in 🎉
        </h2>
        {preview ? (
          <>
            <p className="text-[13px] leading-snug text-secondary">
              This is where a real customer pays by card. Order{" "}
              <strong className="font-display">{reference}</strong> lands
              straight on the shop&rsquo;s dashboard, its stock is held, and
              the buyer is emailed a receipt at <strong>{buyerEmail}</strong>.
            </p>
            <p className="text-[12px] text-secondary">
              Have a look at the order from the other side in{" "}
              <Link href="/admin/orders" className="underline underline-offset-2">
                the admin panel
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] leading-snug text-secondary">
              Card payments aren&rsquo;t switched on yet. Your order ({" "}
              <strong className="font-display">{reference}</strong>) is on
              our dashboard, and we&rsquo;ll email{" "}
              <strong>{buyerEmail}</strong> a secure link to complete the
              purchase.
            </p>
            <p className="text-[12px] text-secondary">
              Your items are held while we review. If you&rsquo;d prefer to
              cancel, just reply to our confirmation email.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="pop-block rounded-sm bg-tint px-3 py-2 font-display text-[12px] tracking-wider text-ink self-end"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
