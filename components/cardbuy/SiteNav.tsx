"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/_actions/auth";
import { useCart } from "@/lib/shop/cart";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BrandWordmark } from "@/components/brand/BrandName";
import { BrandPicker } from "@/components/brand/BrandPicker";

type Tone = "brand" | "tint" | "highlight";

const LINKS: { href: string; label: string; tone: Tone; match: string[] }[] = [
  { href: "/shop", label: "Shop", tone: "brand", match: ["/shop"] },
  { href: "/packs", label: "Sell", tone: "highlight", match: ["/packs", "/search", "/card"] },
  { href: "/binder", label: "Binder", tone: "tint", match: ["/binder"] },
  { href: "/submission", label: "My sale", tone: "tint", match: ["/submission"] },
];

const HOVER: Record<Tone, string> = {
  brand: "hover:bg-brand",
  tint: "hover:bg-tint",
  highlight: "hover:bg-highlight",
};
const ACTIVE: Record<Tone, string> = {
  brand: "bg-brand border-ink",
  tint: "bg-tint border-ink",
  highlight: "bg-highlight border-ink",
};

const BASKET_PATHS = ["/shop/cart", "/shop/checkout"];

function isActive(pathname: string, match: string[]) {
  // The basket has its own nav item, so it doesn't also light up "Shop".
  if (BASKET_PATHS.some((b) => pathname.startsWith(b)) && match.includes("/shop")) return false;
  return match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}

/**
 * Customer site header (client half). Auth facts come from the server
 * wrapper <SellerNav />. Desktop shows the full link row; below `md`
 * the links collapse into a Menu sheet so nothing overflows.
 */
export function SiteNav({
  email,
  showAdmin,
  demoMode,
}: {
  email: string | null;
  showAdmin: boolean;
  demoMode: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const { totalQty } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu on navigation (derived-state pattern, no effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const basketActive = BASKET_PATHS.some((b) => pathname.startsWith(b));

  return (
    <div className="max-w-[1300px] mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between gap-2 md:gap-4">
      <Link href="/" className="flex items-center gap-2 min-w-0 shrink" aria-label="Home">
        <BrandLogo
          priority
          className="w-[26px] h-[28px] md:w-[30px] md:h-[32px] shrink-0"
        />
        <span className="font-display text-[15px] sm:text-[18px] md:text-[20px] lg:text-[22px] tracking-tight leading-[0.95] line-clamp-2 break-words min-w-0">
          <BrandWordmark lastClassName="text-brand" />
        </span>
        {demoMode ? (
          <span className="hidden xl:inline-block bg-ink text-paper-strong border-2 border-ink px-1.5 py-0.5 text-[9px] font-display tracking-wider rotate-[-2deg] shrink-0">
            DEMO
          </span>
        ) : null}
      </Link>

      <nav aria-label="Main" className="flex items-center gap-1 font-display text-[11px] md:text-[12px] tracking-wider shrink-0">
        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.match);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`px-2 lg:px-3 py-1.5 border-2 rounded-sm transition-colors duration-100 ${
                  active ? ACTIVE[l.tone] : `border-transparent hover:border-ink ${HOVER[l.tone]}`
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/shop/cart"
          aria-current={basketActive ? "page" : undefined}
          aria-label={totalQty > 0 ? `Basket, ${totalQty} item${totalQty === 1 ? "" : "s"}` : "Basket"}
          className={`relative px-2 md:px-3 py-1.5 border-2 rounded-sm transition-colors duration-100 ${
            basketActive ? ACTIVE.brand : `border-transparent hover:border-ink ${HOVER.brand}`
          }`}
        >
          Basket
          {totalQty > 0 ? (
            <span className="absolute -top-2 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-paper-strong text-[10px] leading-[18px] text-center tabular">
              {totalQty}
            </span>
          ) : null}
        </Link>

        {demoMode ? <BrandPicker /> : null}

        {/* Desktop account */}
        <div className="hidden md:flex items-center gap-2 ml-1 pl-2 border-l-2 border-ink/15">
          {email ? (
            <>
              <Link
                href="/settings"
                className="text-[10px] text-muted truncate max-w-[130px] hover:text-ink normal-case"
                title={email}
              >
                {email}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-[10px] tracking-wider underline underline-offset-4 decoration-2 hover:text-brand"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="px-2 py-1 border-2 border-ink rounded-sm bg-highlight text-[11px] hover:bg-brand"
            >
              Sign in
            </Link>
          )}
          {showAdmin ? (
            <Link
              href="/admin"
              className="px-2 py-1 border-2 border-ink rounded-sm bg-ink text-paper-strong text-[11px] hover:bg-brand hover:text-ink"
            >
              Admin
            </Link>
          ) : null}
        </div>

        {/* Mobile menu */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className={`px-2 py-1 border-2 border-ink rounded-sm text-[11px] ${menuOpen ? "bg-ink text-paper-strong" : "bg-paper-strong"}`}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="md:hidden fixed inset-0 top-[56px] z-30 bg-ink/30"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-menu"
            className="md:hidden fixed left-0 right-0 top-[56px] z-40 border-y-[3px] border-ink bg-paper-strong px-4 py-4 flex flex-col gap-2 font-display text-[14px] tracking-wider"
          >
            {LINKS.map((l) => {
              const active = isActive(pathname, l.match);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3 py-2.5 border-2 rounded-sm ${active ? ACTIVE[l.tone] : "border-ink/15"}`}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="flex items-center gap-2 pt-2 mt-1 border-t-2 border-rule text-[12px]">
              {email ? (
                <>
                  <Link href="/settings" className="px-3 py-2 border-2 border-ink/15 rounded-sm truncate normal-case">
                    {email}
                  </Link>
                  <form action={signOut} className="ml-auto">
                    <button type="submit" className="px-3 py-2 underline underline-offset-4">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="px-3 py-2 border-2 border-ink rounded-sm bg-highlight">
                  Sign in
                </Link>
              )}
              {showAdmin ? (
                <Link href="/admin" className="ml-auto px-3 py-2 border-2 border-ink rounded-sm bg-ink text-paper-strong">
                  Admin
                </Link>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
