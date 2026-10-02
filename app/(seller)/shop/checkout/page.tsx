import { redirect } from "next/navigation";
import { getViewer } from "@/lib/preview-server";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import { PREVIEW_PROFILE } from "@/lib/mock/mock-customer";
import { listListings } from "@/app/_actions/shop";
import { CheckoutForm } from "./CheckoutForm";
import type { LewisUser } from "@/lib/supabase/types";

export const metadata = { title: "Checkout" };

export const dynamic = "force-dynamic";

type Prefill = Pick<LewisUser, "full_name" | "email" | "postcode" | "country">;

export default async function ShopCheckoutPage() {
  const { supabase, user, preview } = await getViewer();

  // Preview: prefill the sample customer; placing the order skips the
  // write and lands on the sample receipt.
  let profile: Prefill | null = null;
  let fallbackEmail = "";
  let sampleListingIds: string[] = [];
  if (preview) {
    profile = PREVIEW_PROFILE;
    // Two affordable in-stock cards for the "sample basket" shortcut.
    const inStock = await listListings({ inStockOnly: true });
    sampleListingIds = inStock
      .filter((l) => Number(l.price_gbp) <= 200)
      .sort((a, b) => Number(b.price_gbp) - Number(a.price_gbp))
      .slice(0, 2)
      .map((l) => l.id);
  } else {
    if (!user || !supabase) redirect("/login?next=/shop/checkout");
    const { data } = await supabase
      .from("lewis_users")
      .select("full_name, email, postcode, country")
      .eq("id", user.id)
      .maybeSingle<Prefill>();
    profile = data;
    fallbackEmail = user.email ?? "";
  }

  return (
    <>
      {preview ? <PreviewBanner next="/shop/checkout" /> : null}
      <div className="max-w-[1200px] mx-auto px-4 py-8 flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <span className="bg-brand text-ink border-2 border-ink w-fit px-2 py-1 font-display text-[10px] tracking-wider">
            Buying from us
          </span>
          <h1 className="font-display text-[32px] leading-none tracking-tight">
            Checkout
          </h1>
        </header>
        <CheckoutForm
          defaultName={profile?.full_name ?? ""}
          defaultEmail={profile?.email ?? fallbackEmail}
          defaultPostcode={profile?.postcode ?? ""}
          defaultCountry={profile?.country ?? "GB"}
          defaultAddress={
            preview ? { line1: "14 Larch Avenue", city: "Leeds" } : undefined
          }
          preview={preview}
          sampleListingIds={sampleListingIds}
        />
      </div>
    </>
  );
}
