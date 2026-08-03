import { SOCIAL_LINKS } from "./social";

/**
 * Contact + social.
 *
 * No enquiry form: the public site has no mail transport wired up
 * (that's Phase 4), and a form that silently drops messages is worse
 * than none. The email button appears once an address is set in
 * /admin/site; until then socials carry the section.
 */
export function ContactPanel({ content }: { content: Record<string, string> }) {
  const email = content["contact.email"]?.trim();
  const socials = SOCIAL_LINKS.filter((s) => content[s.key]?.trim());

  return (
    <section id="contact" className="bg-paper scroll-mt-24">
      <div className="max-w-[1300px] mx-auto px-5 md:px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="flex flex-col gap-4">
          <span className="bg-sun text-ink border-2 border-ink px-2 py-1 w-fit font-display text-[10px] tracking-wider rounded-sm">
            Contact
          </span>
          <h2 className="font-display text-[30px] sm:text-[40px] md:text-[52px] leading-[0.95] tracking-tight">
            Got something to sell?
          </h2>
          <p className="text-[14px] md:text-[15px] text-secondary max-w-[46ch]">
            {content["contact.blurb"]}
          </p>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="pop-block bg-ocean text-paper-strong rounded-md px-5 py-3 font-display text-[13px] tracking-wider w-fit"
            >
              {email} →
            </a>
          ) : null}
        </div>

        <div className="pop-card rounded-lg p-5 md:p-7 flex flex-col gap-4">
          <span className="font-display text-[10px] tracking-widest text-muted">
            FOLLOW ALONG
          </span>
          <p className="text-[14px] text-secondary">
            {content["contact.social_blurb"]}
          </p>
          <div className="flex flex-col gap-3">
            {socials.map((s) => (
              <a
                key={s.key}
                href={content[s.key]}
                target="_blank"
                rel="noreferrer noopener"
                className="pop-block bg-paper-strong rounded-md px-4 py-3 flex items-center justify-between gap-3"
              >
                <span className="font-display text-[13px] tracking-wider">
                  {s.label}
                </span>
                <span className="text-[12px] text-muted">{s.handle} ↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
