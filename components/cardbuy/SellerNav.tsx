import { WaveDivider } from "@/components/cardbuy/WaveDivider";
import { SiteNav } from "@/components/cardbuy/SiteNav";
import { brand } from "@/lib/brand";
import { previewMode } from "@/lib/preview";
import { getViewer } from "@/lib/preview-server";

/**
 * Customer header — server wrapper. Resolves who's signed in (and
 * whether they're an admin), then hands plain props to the client
 * <SiteNav />. In preview mode the Admin link shows for everyone so a
 * prospect can find the back office.
 */
export async function SellerNav() {
  const { supabase, user } = await getViewer();

  let isAdmin = false;
  if (user && supabase) {
    const { data } = await supabase
      .from("lewis_users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = (data as { role?: string } | null)?.role === "admin";
  }

  return (
    <header className="border-b-[3px] border-ink bg-paper-strong sticky top-0 z-30">
      <SiteNav
        email={user?.email ?? null}
        showAdmin={isAdmin || previewMode}
        demoMode={brand.demoMode}
      />
      <WaveDivider fill="var(--color-brand)" height={10} />
    </header>
  );
}
