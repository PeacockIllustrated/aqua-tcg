import { MarketingNav } from "@/components/marketing/MarketingNav";
import { AnnouncementBar } from "@/components/marketing/AnnouncementBar";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { getSiteContent, getLiveAnnouncements } from "@/lib/marketing/queries";

/**
 * Shell for the public site.
 *
 * Both reads are wrapped in React `cache()`, so sharing them with the
 * page below costs a single round-trip each per render.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [content, announcements] = await Promise.all([
    getSiteContent(),
    getLiveAnnouncements(),
  ]);

  return (
    <>
      <AnnouncementBar announcements={announcements} />
      <MarketingNav />
      {children}
      <SiteFooter content={content} />
    </>
  );
}
