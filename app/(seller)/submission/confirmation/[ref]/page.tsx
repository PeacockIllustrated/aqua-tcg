import { brand } from "@/lib/brand";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Annotation } from "@/components/wireframe/Annotation";
import { getSubmissionByReference } from "@/app/_actions/submission";
import { formatGBP } from "@/lib/mock/mock-offer";
import { getViewer } from "@/lib/preview-server";
import { PreviewBanner } from "@/components/preview/PreviewBanner";

export async function generateMetadata({ params }: { params: Params }) {
  const { ref } = await params;
  return { title: `Sale ${ref}` };
}

type Params = Promise<{ ref: string }>;

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Params;
}) {
  const { ref } = await params;
  // Preview: getSubmissionByReference returns a sample for any ref.
  const [{ preview }, result] = await Promise.all([
    getViewer(),
    getSubmissionByReference(ref),
  ]);
  if (!result) notFound();

  const { submission, items } = result;
  const totalCards = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
    {preview ? (
      <PreviewBanner next={`/submission/confirmation/${ref}`} />
    ) : null}
    <div className="max-w-[900px] mx-auto px-4 py-10 flex flex-col gap-8">
      <header className="pop-block bg-highlight rounded-lg p-6 flex flex-col gap-3">
        <span className="bg-ink text-paper-strong w-fit px-2 py-1 font-display text-[10px] tracking-wider">
          Submission logged
        </span>
        <h1 className="font-display text-[32px] md:text-[40px] leading-[0.95] tracking-tight break-all">
          {submission.reference}
        </h1>
        <p className="text-[14px]">
          Thanks — your sale is logged with a total offer of{" "}
          <strong className="font-display tabular-nums">
            {formatGBP(Number(submission.total_offered ?? 0))}
          </strong>{" "}
          across <strong className="font-display">{totalCards}</strong> cards.
          Quote this reference in any emails.
        </p>
      </header>

      <section className="pop-card rounded-md p-5 flex flex-col gap-2">
        <Annotation>SHIP YOUR CARDS TO</Annotation>
        <address className="not-italic font-display text-[15px] leading-[1.6] tracking-tight">
          {brand.name}
          {brand.address.map((line) => (
            <span key={line}>
              <br />
              {line}
            </span>
          ))}
        </address>
      </section>

      <section className="flex flex-col gap-3">
        <Annotation>WHAT HAPPENS NEXT · 4 steps</Annotation>
        <ol className="flex flex-col gap-3 text-[14px] list-decimal pl-5">
          <li>Pack your cards in penny sleeves + toploaders + a padded mailer.</li>
          <li>Post via Royal Mail Tracked. Keep your receipt until we mark received.</li>
          <li>
            We verify each card&apos;s condition on arrival. If a card is graded
            differently to your declaration, we revise the offer and you can
            accept or request return.
          </li>
          <li>We pay via PayPal within 48h of approval.</li>
        </ol>
      </section>

      <section className="pop-card rounded-md p-4 flex flex-col gap-2">
        <Annotation>STATUS</Annotation>
        <div className="font-display text-[18px] tracking-tight uppercase">
          {statusLabel(submission.status)}
        </div>
        <div className="text-[12px] text-muted">
          We&apos;ll email you when the parcel is received.
        </div>
      </section>

      <footer className="text-[12px] text-muted">
        Questions? Email{" "}
        <a href={`mailto:${brand.supportEmail}`} className="underline">{brand.supportEmail}</a> and quote{" "}
        {submission.reference}.{" "}
        <Link href="/packs" className="underline underline-offset-4 decoration-2">
          Start another sale →
        </Link>
      </footer>
    </div>
    </>
  );
}

function statusLabel(s: string): string {
  switch (s) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Awaiting cards";
    case "awaiting_cards":
      return "Awaiting cards";
    case "received":
      return "Received";
    case "under_review":
      return "Under review";
    case "offer_revised":
      return "Offer revised";
    case "approved":
      return "Approved";
    case "paid":
      return "Paid";
    case "rejected":
      return "Rejected";
    case "returned":
      return "Returned";
    case "cancelled":
      return "Cancelled";
    default:
      return s;
  }
}
