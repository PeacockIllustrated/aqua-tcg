"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WaveDivider } from "@/components/cardbuy/WaveDivider";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BrandName } from "@/components/brand/BrandName";
import { brand } from "@/lib/brand";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Buy",
    links: [
      { href: "/shop", label: "Shop all cards" },
      { href: "/shop/cart", label: "Your basket" },
      { href: "/help/shipping", label: "Shipping & returns" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/search", label: "Get an instant offer" },
      { href: "/packs", label: "Browse by set" },
      { href: "/submission", label: "Your sale" },
      { href: "/help/selling", label: "How selling works" },
    ],
  },
  {
    title: "Collect",
    links: [
      { href: "/binder", label: "Your binder" },
      { href: "/settings", label: "Account & privacy" },
    ],
  },
];

export function PageFooter() {
  const pathname = usePathname() ?? "";
  // Admin is its own self-contained portal — no marketing footer.
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-12">
      {/* Wave sits on the page ground and rises into the ink footer. */}
      <WaveDivider fill="var(--color-ink)" height={32} />
      <div className="bg-ink text-paper-strong -mt-px">
        <div className="max-w-[1300px] mx-auto px-4 pt-6 pb-8 grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <span className="w-[38px] h-[40px] bg-paper-strong rounded-sm p-1 flex items-center justify-center">
                <BrandLogo className="w-full h-full" />
              </span>
              <span className="font-display text-[20px] tracking-tight text-highlight">
                <BrandName />
              </span>
            </Link>
            <p className="text-[13px] text-paper-strong/70 max-w-[34ch]">
              Buy and sell Pokémon cards with a local dealer. Instant offers,
              hand-picked stock, fast UK dispatch.
            </p>
            <a
              href={`mailto:${brand.supportEmail}`}
              className="text-[13px] underline underline-offset-4 decoration-paper-strong/40 hover:decoration-highlight w-fit"
            >
              {brand.supportEmail}
            </a>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2">
              <span className="font-display text-[11px] tracking-wider text-paper-strong/50">
                {col.title}
              </span>
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[13px] w-fit hover:text-highlight hover:underline underline-offset-4"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="border-t border-paper-strong/15">
          <div className="max-w-[1300px] mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-paper-strong/50">
            <span>
              © {new Date().getFullYear()} <BrandName />. Pokémon and card names
              are trademarks of their respective owners.
            </span>
            <span className="flex gap-4">
              <Link href="/help/terms" className="hover:text-paper-strong">Terms</Link>
              <Link href="/help/privacy" className="hover:text-paper-strong">Privacy</Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
