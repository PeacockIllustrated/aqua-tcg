import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SiteContentForm } from "./SiteContentForm";
import { AnnouncementsEditor } from "./AnnouncementsEditor";
import {
  getContentOverrides,
  isCmsReady,
  listAllAnnouncements,
} from "@/lib/marketing/queries";

export const metadata: Metadata = { title: "Site content" };

/**
 * Editor for the public one-pager — copy overrides plus the
 * announcement bar.
 *
 * Access is gated three ways: `middleware.ts` redirects non-admins away
 * from `/admin/*`, RLS rejects the writes, and the actions bail without
 * a signed-in user.
 */
export default async function AdminSitePage() {
  const [ready, overrides, announcements] = await Promise.all([
    isCmsReady(),
    getContentOverrides(),
    listAllAnnouncements(),
  ]);

  return (
    <div className="px-3 md:px-5 py-4 flex flex-col gap-5 max-w-[1100px]">
      <AdminPageHeader
        crumbs={[{ label: "Admin", href: "/admin" }, { label: "Site content" }]}
        title="Site content"
        kicker={
          ready
            ? { label: "LIVE", tone: "ocean" }
            : { label: "MIGRATION NEEDED", tone: "sun" }
        }
        subtitle={
          <>
            Copy and announcements for the public page at{" "}
            <Link href="/" className="underline underline-offset-2">
              aquatcg.co.uk
            </Link>
            . Changes go live immediately. Anything left blank falls back to the
            built-in copy, so you can&apos;t accidentally empty a section.
          </>
        }
      />

      <AnnouncementsEditor announcements={announcements} ready={ready} />

      <SiteContentForm overrides={overrides} ready={ready} />
    </div>
  );
}
