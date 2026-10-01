import { Annotation } from "@/components/wireframe/Annotation";
import { LinkButton } from "@/components/ui/Form";
import { Table, THead, TBody, TR, TH } from "@/components/ui/Table";
import { getDraftSubmission } from "@/app/_actions/submission";
import { getCardById, setOf } from "@/lib/fixtures/cards";
import { formatGBP } from "@/lib/mock/mock-offer";
import { getViewer } from "@/lib/preview-server";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import { SubmissionItemRow } from "./SubmissionItemRow";

export const metadata = { title: "Your sale" };

export const dynamic = "force-dynamic";

export default async function SubmissionPage() {
  const { user, preview } = await getViewer();

  // Preview renders the sample draft below; only a real signed-out
  // visitor (preview mode off) gets the sign-in prompt.
  if (!user && !preview) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-12 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="bg-highlight text-ink border-2 border-ink w-fit px-2 py-1 font-display text-[10px] tracking-wider rounded-sm">
            Selling to us
          </span>
          <h1 className="font-display text-[36px] leading-none tracking-tight">
            Your sale
          </h1>
        </header>
        <div className="pop-card rounded-md p-8 text-center flex flex-col gap-3 items-center">
          <span className="font-display text-[22px]">Sign in to build your sale</span>
          <p className="text-[13px] text-secondary max-w-[42ch]">
            We save your draft to your account so you can add cards from
            any device and come back to it later.
          </p>
          <LinkButton href="/login?next=/submission" size="lg" className="mt-2">Sign in →</LinkButton>
        </div>
      </div>
    );
  }

  const draft = await getDraftSubmission();
  const items = draft?.items ?? [];
  const totalCards = items.reduce((s, i) => s + i.quantity, 0);
  const totalOffered = draft?.submission.total_offered ?? 0;

  return (
    <>
    {preview ? <PreviewBanner next="/submission" /> : null}
    <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="bg-highlight text-ink border-2 border-ink w-fit px-2 py-1 font-display text-[10px] tracking-wider rounded-sm">
          Selling to us
        </span>
        <h1 className="font-display text-[36px] leading-none tracking-tight">
          Your sale
        </h1>
        {draft ? (
          <p className="text-[12px] text-muted font-display tracking-wider tabular-nums">
            Draft {draft.submission.reference}
          </p>
        ) : null}
      </header>

      {items.length === 0 ? (
        <div className="pop-card rounded-md p-10 text-center flex flex-col gap-3 items-center">
          <span className="font-display text-[22px]">
            Your sale is empty
          </span>
          <p className="text-[13px] text-secondary max-w-[42ch]">
            Pick a pack and tap the cards you want to sell. We&apos;ll
            quote every card in GBP on the spot.
          </p>
          <LinkButton href="/packs" size="lg" className="mt-2 w-fit self-center">
            Browse packs →
          </LinkButton>
        </div>
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Card</TH>
                <TH className="hidden sm:table-cell">Variant</TH>
                <TH>Qty</TH>
                <TH className="hidden md:table-cell text-right">Per</TH>
                <TH className="text-right">Total</TH>
                <TH className="hidden sm:table-cell">
                  <span className="sr-only">Remove</span>
                </TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => {
                const card = getCardById(item.card_id);
                const set = card ? setOf(card) : undefined;
                return (
                  <SubmissionItemRow
                    key={item.id}
                    item={item}
                    cardName={card?.name ?? item.card_id}
                    setName={set?.name ?? "—"}
                    rarity={card?.rarity ?? null}
                    imageUrl={card?.images.small ?? null}
                  />
                );
              })}
            </TBody>
          </Table>

          <section className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5">
            <div className="pop-card rounded-md p-4 flex flex-col gap-2">
              <Annotation>NEXT STEP</Annotation>
              <p className="text-[13px] text-secondary">
                When you&apos;re done adding cards, head to the submit
                page to enter your details and get shipping instructions.
              </p>
            </div>

            <div className="pop-block bg-paper-strong rounded-md p-4 flex flex-col gap-3">
              <Annotation>SUMMARY</Annotation>
              <div className="flex justify-between text-[13px] tabular-nums">
                <span className="text-secondary">Cards</span>
                <span className="font-display">{totalCards}</span>
              </div>
              <div className="flex justify-between text-[13px] tabular-nums">
                <span className="text-secondary">Lines</span>
                <span className="font-display">{items.length}</span>
              </div>
              <div className="border-t-[3px] border-ink pt-3 flex justify-between items-baseline">
                <span className="text-[10px] font-display uppercase tracking-wider text-secondary">
                  Total offer
                </span>
                <span className="font-display text-[28px] tabular-nums leading-none">
                  {formatGBP(Number(totalOffered))}
                </span>
              </div>
              <LinkButton href="/submission/submit" size="lg" className="w-full">Continue to submit →</LinkButton>
            </div>
          </section>
        </>
      )}
    </div>
    </>
  );
}
