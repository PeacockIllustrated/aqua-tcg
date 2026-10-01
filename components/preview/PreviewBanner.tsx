import Link from "next/link";
import { hasDatabase } from "@/lib/preview";

/**
 * Strip shown at the top of any page that is normally behind sign-in
 * (or admin-only) when it's being viewed in preview mode. Server- and
 * client-safe.
 */
export function PreviewBanner({
  area = "sign-in",
  next,
}: {
  /** What normally gates the page: customer sign-in or the admin role. */
  area?: "sign-in" | "admin";
  /** Path to return to after signing in. */
  next?: string;
}) {
  const gate = area === "admin" ? "the shop's admin login" : "sign-in";
  return (
    <div
      role="note"
      className="border-b-[3px] border-ink bg-ink text-paper-strong"
    >
      <div className="max-w-[1300px] mx-auto px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
        <span className="font-display text-[10px] tracking-wider bg-highlight text-ink border-2 border-paper-strong px-1.5 py-0.5 rounded-sm">
          PREVIEW
        </span>
        <span>
          This page is normally behind {gate}. You&rsquo;re seeing sample
          data, and changes won&rsquo;t be saved.
        </span>
        {hasDatabase ? (
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="ml-auto font-display text-[10px] tracking-wider underline underline-offset-4 decoration-2 hover:text-highlight"
          >
            Sign in for real →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
