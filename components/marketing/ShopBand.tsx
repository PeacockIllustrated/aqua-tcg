import { PhotoFrame } from "@/components/marketing/PhotoFrame";
import { WaveDivider } from "@/components/cardbuy/WaveDivider";
import { resolvePhoto } from "@/lib/marketing/media";

/**
 * Full-bleed photographic band, sitting between the singles-wall reel and
 * "what we stock".
 *
 * The reel above it is the wall rendered as 3D card art; this is the wall
 * as it actually is. Putting the two next to each other is deliberate — the
 * reel sells the idea, the photograph proves the shop exists. It is the
 * widest crop on the page (21:9) and the only edge-to-edge element, so it
 * also gives the run of contained sections somewhere to breathe.
 *
 * With no photograph set it renders `PhotoFrame`'s designed panel at the
 * same size, which reads as an intentional brand band rather than a hole.
 */
export function ShopBand({ content }: { content: Record<string, string> }) {
  const wall = resolvePhoto(content, "wall");

  return (
    <section aria-label="Inside the shop" className="bg-paper relative">
      <PhotoFrame
        photo={wall}
        variant="bleed"
        caption="OVER 1,000 SINGLES · CHANGING DAILY"
        sizes="100vw"
      />
      {/* Seam back into the cream, so the band rises out of the page. */}
      <WaveDivider
        fill="var(--color-paper)"
        height={30}
        className="-mt-[30px] relative z-[3]"
      />
    </section>
  );
}
