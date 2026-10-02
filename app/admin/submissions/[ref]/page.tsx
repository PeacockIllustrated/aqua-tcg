import Link from "next/link";
import { notFound } from "next/navigation";
import { Annotation } from "@/components/wireframe/Annotation";
import { SubmissionReview, type ReviewItem } from "@/components/admin/SubmissionReview";
import { getAdminSubmission } from "@/app/_actions/admin";
import { getAdminMarginConfig } from "@/app/_actions/margins";
import { getCardById, getSetById } from "@/lib/fixtures/cards";
import { formatGBP } from "@/lib/mock/mock-offer";
import type { ItemCondition } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ ref: string }>;

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Params;
}) {
  const { ref } = await params;
  const [result, marginConfig] = await Promise.all([
    getAdminSubmission(ref),
    getAdminMarginConfig(),
  ]);
  if (!result) notFound();

  const { submission, items, seller } = result;

  const reviewItems: ReviewItem[] = items.map((it) => {
    const card = getCardById(it.card_id);
    const setId = it.card_id.split("-")[0];
    return {
      id: it.id,
      card_name: card?.name ?? it.card_id,
      set_name: getSetById(setId)?.name ?? setId,
      variant: it.variant,
      condition: it.condition,
      grading_company: it.grading_company,
      grade: it.grade,
      quantity: it.quantity,
      offered_amount_per: Number(it.offered_amount_per),
      verified_condition: (it.verified_condition as ItemCondition | null) ?? null,
    };
  });

  return (
    <div className="px-4 py-6 max-w-[1200px] mx-auto flex flex-col gap-6">
      <nav className="text-[12px] text-muted font-display tracking-wider">
        <Link
          href="/admin/submissions"
          className="underline underline-offset-4 decoration-2 hover:text-brand"
        >
          ← Submissions
        </Link>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Metadata column */}
        <aside className="pop-card rounded-md p-4 flex flex-col gap-3 h-fit">
          <Annotation>SUBMISSION</Annotation>
          <h1 className="font-mono text-[18px] break-all tabular-nums">
            {submission.reference}
          </h1>
          <dl className="text-[12px] flex flex-col gap-2">
            <div>
              <dt className="text-muted font-display uppercase tracking-wider text-[10px]">
                Seller
              </dt>
              <dd className="font-display">{seller.full_name ?? "—"}</dd>
              <dd className="text-muted break-all">{seller.email}</dd>
              {seller.postcode ? (
                <dd className="text-muted">
                  {seller.postcode}, {seller.country ?? "GB"}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-muted font-display uppercase tracking-wider text-[10px]">
                Payout
              </dt>
              <dd>
                {submission.payout_method === "paypal"
                  ? "PayPal cash"
                  : submission.payout_method === "store_credit"
                    ? "Store credit"
                    : "—"}
              </dd>
              {seller.paypal_email ? (
                <dd className="text-muted break-all">{seller.paypal_email}</dd>
              ) : null}
            </div>
            <div>
              <dt className="text-muted font-display uppercase tracking-wider text-[10px]">
                Shipping
              </dt>
              <dd>
                {submission.shipping_method === "royal_mail_tracked"
                  ? "Royal Mail Tracked"
                  : "Self-posted"}
              </dd>
            </div>
            <div>
              <dt className="text-muted font-display uppercase tracking-wider text-[10px]">
                Offered
              </dt>
              <dd className="font-display tabular-nums">
                {formatGBP(Number(submission.total_offered ?? 0))}
              </dd>
            </div>
            <div>
              <dt className="text-muted font-display uppercase tracking-wider text-[10px]">
                Submitted
              </dt>
              <dd className="tabular-nums font-mono text-[11px]">
                {submission.submitted_at
                  ? new Date(submission.submitted_at)
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")
                  : "—"}
              </dd>
            </div>
            {submission.notes_internal ? (
              <div>
                <dt className="text-muted font-display uppercase tracking-wider text-[10px]">
                  Internal note
                </dt>
                <dd className="text-[12px] leading-snug">{submission.notes_internal}</dd>
              </div>
            ) : null}
          </dl>
        </aside>

        {/* Cards + verification + summary */}
        <div className="flex flex-col gap-4">
          <SubmissionReview
            submissionId={submission.id}
            initialStatus={submission.status}
            totalOffered={Number(submission.total_offered ?? 0)}
            totalPaid={
              submission.total_paid !== null ? Number(submission.total_paid) : null
            }
            items={reviewItems}
            conditionMultipliers={marginConfig.condition_multipliers}
          />
        </div>
      </div>
    </div>
  );
}
