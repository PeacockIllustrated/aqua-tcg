import Link from "next/link";
import Image from "next/image";
import { WaveDivider } from "@/components/cardbuy/WaveDivider";

/**
 * Footer for the platform routes (shop, buylist, binder, submissions).
 *
 * The public site has its own footer in `components/marketing/SiteFooter`;
 * this one only ever renders inside `(seller)/layout.tsx`, which is why
 * it no longer needs the `usePathname` guard that kept it off `/admin/*`
 * back when it lived in the root layout — and no longer needs to be a
 * client component at all.
 */
export function PageFooter() {
  return (
    <footer className="bg-ink text-paper-strong mt-12">
      <WaveDivider fill="var(--color-ink)" height={32} />
      <div className="max-w-[1300px] mx-auto px-4 pb-6 flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/aqua-tcg.svg"
            alt=""
            width={28}
            height={30}
            className="w-[28px] h-[30px]"
          />
          <span className="font-display text-[20px] tracking-tight text-sun">
            Aqua&nbsp;TCG
          </span>
          <span className="text-[11px] text-paper-strong/60">
            buy &amp; sell pokémon cards
          </span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-display text-[11px] tracking-wider">
          <Link href="/shop" className="hover:text-ocean">
            Shop
          </Link>
          <Link href="/search" className="hover:text-sun">
            Sell to us
          </Link>
          <Link href="/binder" className="hover:text-wave">
            Binder
          </Link>
          <Link href="/" className="hover:text-wave">
            Public site
          </Link>
        </nav>
      </div>
    </footer>
  );
}
