import Image from "next/image";
import { WaveDivider } from "@/components/cardbuy/WaveDivider";
import { NAV_SECTIONS } from "./sections";
import { SOCIAL_LINKS } from "./social";

/**
 * Public site footer.
 *
 * Links only to sections of the one-pager and to external socials — the
 * platform routes (shop, buylist, binder, admin) are intentionally
 * absent from every public surface.
 */
export function SiteFooter({ content }: { content: Record<string, string> }) {
  const socials = SOCIAL_LINKS.filter((s) => content[s.key]?.trim());
  const year = new Date().getFullYear();

  const addressLines = [
    content["visit.address_1"],
    content["visit.address_2"],
    content["visit.postcode"],
  ].filter((line) => line?.trim());

  return (
    <footer className="bg-ink text-paper-strong mt-0">
      <WaveDivider fill="var(--color-ink)" height={32} />
      <div className="max-w-[1300px] mx-auto px-4 pb-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 justify-between">
          <div className="flex flex-col gap-3 max-w-[38ch]">
            <div className="flex items-center gap-3">
              <Image
                src="/aqua-tcg.svg"
                alt=""
                width={28}
                height={30}
                className="w-[28px] h-[30px]"
              />
              <span className="font-display text-[22px] tracking-tight text-sun">
                Aqua&nbsp;TCG
              </span>
            </div>
            <p className="text-[12px] text-paper-strong/70">
              {content["footer.tagline"]}
            </p>
            {addressLines.length > 0 ? (
              <address className="not-italic text-[12px] text-paper-strong/60 leading-relaxed">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            ) : null}
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-2">
            <span className="font-display text-[10px] tracking-[0.25em] text-paper-strong/45">
              This page
            </span>
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="font-display text-[12px] tracking-wider hover:text-ocean w-fit"
              >
                {s.label}
              </a>
            ))}
          </nav>

          {socials.length > 0 ? (
            <div className="flex flex-col gap-2">
              <span className="font-display text-[10px] tracking-[0.25em] text-paper-strong/45">
                Follow
              </span>
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={content[s.key]}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-display text-[12px] tracking-wider hover:text-sun w-fit"
                >
                  {s.label} ↗
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t-2 border-paper-strong/15 pt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-paper-strong/45">
          <span>© {year} Aqua TCG</span>
          <span>
            Pokémon and all related characters are trademarks of Nintendo,
            Creatures Inc. and GAME FREAK Inc. Aqua TCG is not affiliated with
            or endorsed by them.
          </span>
        </div>
      </div>
    </footer>
  );
}
