import Image from "next/image";
import { WaveDivider } from "@/components/cardbuy/WaveDivider";

/**
 * Brand hero — the Aqua TCG mark on the ocean ground, with a rotating
 * gold sunburst, a soft halo so the blue mark separates from the blue
 * field, and a wave seam into the content below.
 *
 * Carried over from the platform homepage's identity block; the copy is
 * now content-driven and the CTAs point at sections of this page rather
 * than into the buylist.
 */
export function HeroLockup({ content }: { content: Record<string, string> }) {
  return (
    <section className="bg-ocean relative overflow-hidden">
      {/* Decorative pop-art dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-ink) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* `justify-center` matters on wide screens: the mark and the copy
          column are both fixed-ish widths, so left-packing them inside a
          1300px container left a dead third on the right. */}
      <div className="relative max-w-[1300px] mx-auto px-5 md:px-8 py-10 md:py-16 lg:py-20 flex flex-col md:flex-row md:justify-center items-center gap-8 md:gap-12 lg:gap-16">
        {/* LOGO MARK */}
        <div className="relative shrink-0 w-[230px] h-[230px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] flex items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-[-26%] animate-[spin_30s_linear_infinite] motion-reduce:animate-none"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, var(--color-sun) 0deg 8deg, transparent 8deg 18deg)",
              WebkitMaskImage:
                "radial-gradient(circle, #000 33%, transparent 68%)",
              maskImage: "radial-gradient(circle, #000 33%, transparent 68%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-[15%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.42) 46%, transparent 72%)",
            }}
          />
          <Image
            src="/aqua-tcg.svg"
            alt="Aqua TCG"
            width={300}
            height={325}
            priority
            className="relative w-[64%] md:w-[68%] h-auto [filter:drop-shadow(5px_5px_0_var(--color-ink))]"
          />
          <div className="absolute top-0 right-1 md:top-2 md:right-3 w-10 h-10 md:w-14 md:h-14 bg-paper-strong border-[3px] border-ink rounded-full flex items-center justify-center rotate-12">
            <span className="font-display text-[12px] md:text-[16px] leading-none text-ink">
              ★
            </span>
          </div>
        </div>

        {/* WORDMARK + COPY */}
        <div className="flex flex-col gap-3 md:gap-4 text-center md:text-left">
          <span className="font-display text-[10px] md:text-[11px] tracking-widest text-ink bg-sun border-2 border-ink px-2 py-1 rounded-sm w-fit mx-auto md:mx-0">
            {content["hero.eyebrow"]}
          </span>

          <h1 className="font-display leading-[0.85] tracking-tight text-[52px] sm:text-[76px] md:text-[96px] lg:text-[120px] text-paper-strong [text-shadow:4px_4px_0_var(--color-ink)]">
            AQUA
            <br />
            <span className="text-sun">TCG</span>
          </h1>

          <p className="font-display text-[12px] sm:text-[14px] md:text-[16px] tracking-wider text-ink max-w-[48ch] mx-auto md:mx-0">
            {content["hero.tagline"]}
          </p>

          <p className="text-[13px] md:text-[15px] text-ink/85 max-w-[52ch] mx-auto md:mx-0">
            {content["hero.body"]}
          </p>

          <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
            <a
              href="#visit"
              className="pop-block bg-paper-strong text-ink rounded-md px-5 py-3 font-display text-[13px] tracking-wider"
            >
              Visit the shop →
            </a>
            <a
              href="#trade"
              className="pop-block bg-sun text-ink rounded-md px-5 py-3 font-display text-[13px] tracking-wider"
            >
              Buy · sell · trade
            </a>
          </div>
        </div>
      </div>

      <WaveDivider
        fill="var(--color-paper)"
        height={44}
        className="relative z-[1] -mb-px"
      />
    </section>
  );
}
