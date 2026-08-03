import { WaveDivider } from "@/components/cardbuy/WaveDivider";
import { PhotoFrame } from "@/components/marketing/PhotoFrame";
import { resolvePhoto } from "@/lib/marketing/media";

/**
 * The founders' story, on the ocean ground so it breaks up the run of
 * cream sections either side of it.
 *
 * The left column used to be a chip and a heading against a lot of empty
 * blue on desktop. It now carries the founders' portrait, which is the one
 * photograph on the page that genuinely has to be of specific people.
 */
export function StoryPanel({ content }: { content: Record<string, string> }) {
  const paragraphs = [
    content["story.body_1"],
    content["story.body_2"],
    content["story.body_3"],
  ].filter((p) => p?.trim());

  const founders = resolvePhoto(content, "founders");

  return (
    <section id="story" className="bg-ocean scroll-mt-24 relative">
      <WaveDivider fill="var(--color-ocean)" height={28} flip />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-ink) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative max-w-[1300px] mx-auto px-5 md:px-6 py-12 md:py-16 grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-12 items-start">
        <div className="flex flex-col gap-3">
          <span className="bg-ink text-paper-strong px-2 py-1 w-fit font-display text-[10px] tracking-wider">
            Our story
          </span>
          <h2 className="font-display text-[32px] sm:text-[44px] md:text-[56px] leading-[0.9] tracking-tight text-paper-strong [text-shadow:3px_3px_0_var(--color-ink)]">
            TWO MATES
            <br />
            <span className="text-sun">FROM GATESHEAD</span>
          </h2>

          <PhotoFrame
            photo={founders}
            tone="soft"
            badge
            caption="JAMES & LEWIS"
            className="mt-1 max-w-[380px] md:max-w-none"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>

        <div className="pop-static bg-paper-strong rounded-lg p-5 md:p-7 flex flex-col gap-4">
          {paragraphs.map((text, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "text-[15px] md:text-[17px] leading-relaxed text-ink"
                  : "text-[14px] md:text-[15px] leading-relaxed text-secondary"
              }
            >
              {text}
            </p>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            {["Since 2024", "UK card shows", "Collectors first"].map((chip) => (
              <span
                key={chip}
                className="font-display text-[10px] tracking-widest bg-wave text-ink border-2 border-ink px-2 py-1 rounded-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <WaveDivider fill="var(--color-paper)" height={36} className="-mb-px" />
    </section>
  );
}
