import Link from "next/link";
import { redirect } from "next/navigation";
import { Annotation } from "@/components/wireframe/Annotation";
import { LinkButton } from "@/components/ui/Form";
import { getDraftSubmission } from "@/app/_actions/submission";
import { formatGBP } from "@/lib/mock/mock-offer";
import { getViewer } from "@/lib/preview-server";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import { PREVIEW_PROFILE } from "@/lib/mock/mock-customer";
import { SubmitForm } from "./SubmitForm";
import type { LewisUser } from "@/lib/supabase/types";

export const metadata = { title: "Submit your sale" };

export const dynamic = "force-dynamic";

export default async function SubmissionSubmitPage() {
  const { supabase, user, preview } = await getViewer();
  if (!preview && (!user || !supabase)) {
    redirect("/login?next=/submission/submit");
  }

  const draft = await getDraftSubmission();
  if (!draft || draft.items.length === 0) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-12 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="bg-highlight text-ink border-2 border-ink w-fit px-2 py-1 font-display text-[10px] tracking-wider rounded-sm">
            Almost done
          </span>
          <h1 className="font-display text-[32px] leading-none tracking-tight">
            Nothing to submit
          </h1>
        </header>
        <div className="pop-card rounded-md p-8 text-center flex flex-col gap-3 items-center">
          <p className="text-[13px] text-secondary max-w-[42ch]">
            Your sale is empty. Add at least one card before you
            can submit.
          </p>
          <LinkButton href="/packs" size="lg" className="mt-2">Browse packs →</LinkButton>
        </div>
      </div>
    );
  }

  let profile: LewisUser | null = null;
  if (preview) {
    profile = PREVIEW_PROFILE;
  } else if (supabase && user) {
    const { data } = await supabase
      .from("lewis_users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<LewisUser>();
    profile = data;
  }

  const totalCards = draft.items.reduce((s, i) => s + i.quantity, 0);
  const totalOffered = draft.submission.total_offered ?? 0;

  return (
    <>
    {preview ? <PreviewBanner next="/submission/submit" /> : null}
    <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="bg-highlight text-ink border-2 border-ink w-fit px-2 py-1 font-display text-[10px] tracking-wider rounded-sm">
          Almost done
        </span>
        <h1 className="font-display text-[32px] leading-none tracking-tight">
          Confirm your sale
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 items-start">
        <SubmitForm
          profile={profile}
          defaultEmail={user?.email ?? profile?.email ?? ""}
          preview={preview}
        />

        <aside className="pop-block bg-paper-strong rounded-md p-5 flex flex-col gap-3 sticky top-[80px]">
          <Annotation>SUMMARY</Annotation>
          <div className="flex justify-between text-[13px] tabular-nums">
            <span className="text-secondary">Cards</span>
            <span className="font-display">{totalCards}</span>
          </div>
          <div className="flex justify-between text-[13px] tabular-nums">
            <span className="text-secondary">Lines</span>
            <span className="font-display">{draft.items.length}</span>
          </div>
          <div className="border-t-[3px] border-ink pt-3 flex justify-between items-baseline">
            <span className="text-[10px] font-display uppercase tracking-wider text-secondary">
              Total offer
            </span>
            <span className="font-display text-[24px] tabular-nums leading-none">
              {formatGBP(Number(totalOffered))}
            </span>
          </div>
          <Link
            href="/submission"
            className="text-[11px] font-display tracking-wider underline underline-offset-4 decoration-2 text-muted hover:text-brand"
          >
            ← back to your sale
          </Link>
        </aside>
      </div>
    </div>
    </>
  );
}
