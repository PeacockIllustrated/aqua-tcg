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
    /**
     * `overflow-x: clip` stops the page scrolling sideways.
     *
     * Several things here deliberately paint outside the viewport: the
     * singles-wall reel fans its cards well past both edges before the
     * scroll pins them, the wave seams draw on an oversized viewBox, and
     * the pop-art offset shadows sit proud of their blocks. Without this
     * the document was horizontally scrollable by ~2.1k px at desktop and
     * ~2.4k at mobile — you could drag the whole page off to one side and
     * find empty cream.
     *
     * `clip` rather than `hidden` on purpose: `hidden` would make this a
     * scroll container, which breaks the `position: sticky` the reel's
     * scroll-pinning depends on. `clip` cuts the paint without creating
     * one.
     *
     * Set inline rather than via `overflow-x-clip`: that utility is not
     * emitted in this project's Tailwind build (it renders, but computes
     * to `visible`), so the class silently did nothing.
     */
    <div style={{ overflowX: "clip" }}>
      <AnnouncementBar announcements={announcements} />
      <MarketingNav />
      {children}
      <SiteFooter content={content} />
    </div>
  );
}
