import { PhotoFrame } from "@/components/marketing/PhotoFrame";
import { resolvePhoto } from "@/lib/marketing/media";

/**
 * Store details.
 *
 * Hours and postcode couldn't be confirmed when this page was built, so
 * both are optional: each block is omitted entirely rather than shipping
 * a placeholder, and both are editable from /admin/site.
 *
 * The shopfront photo leads the section: someone deciding whether to walk
 * over needs to recognise the unit when they get there, and the Metrocentre
 * is big enough that an address alone is not much help.
 */
export function VisitPanel({ content }: { content: Record<string, string> }) {
  const storefront = resolvePhoto(content, "storefront");
  const hours = (content["visit.hours"] ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const addressLines = [
    content["visit.address_1"],
    content["visit.address_2"],
    content["visit.postcode"],
  ].filter((line) => line?.trim());

  return (
    <section
      id="visit"
      className="bg-paper scroll-mt-24 border-b-[3px] border-ink"
    >
      <div className="max-w-[1300px] mx-auto px-5 md:px-6 py-12 md:py-16 flex flex-col gap-8">
        <div className="flex flex-col gap-3 max-w-[62ch]">
          <span className="bg-wave text-ink border-2 border-ink px-2 py-1 w-fit font-display text-[10px] tracking-wider rounded-sm">
            Visit us
          </span>
          <h2 className="font-display text-[30px] sm:text-[40px] md:text-[52px] leading-[0.95] tracking-tight">
            Find us at the Metrocentre.
          </h2>
          <p className="text-[14px] md:text-[15px] text-secondary">
            {content["visit.note"]}
          </p>
        </div>

        <PhotoFrame
          photo={storefront}
          seamFill="var(--color-paper)"
          caption="THE CRESCENT · UPPER GREEN MALL"
          sizes="(max-width: 1300px) 100vw, 1268px"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="pop-block bg-ocean text-paper-strong rounded-lg p-5 md:p-6 flex flex-col gap-3 md:col-span-2">
            <span className="font-display text-[10px] tracking-widest text-paper-strong/70">
              THE SHOP
            </span>
            <address className="not-italic font-display text-[22px] md:text-[30px] leading-[1.05] tracking-tight">
              {addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="text-[13px] text-paper-strong/85 max-w-[46ch]">
              Over 1,000 singles on the wall, plus graded, sealed and
              accessories — and someone behind the counter who actually wants
              to talk cards.
            </p>
          </div>

          <div className="pop-card rounded-lg p-5 md:p-6 flex flex-col gap-3">
            <span className="font-display text-[10px] tracking-widest text-muted">
              OPENING HOURS
            </span>
            {hours.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {hours.map((line) => (
                  <li
                    key={line}
                    className="text-[13px] text-ink border-b-2 border-ink/10 pb-1.5 last:border-b-0"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-secondary">
                Our hours follow the Metrocentre&apos;s. Check our socials for
                anything out of the ordinary.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
