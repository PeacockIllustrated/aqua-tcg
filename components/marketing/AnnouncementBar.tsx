"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { LewisAnnouncement } from "@/lib/supabase/types";

const TONE_CLASS: Record<LewisAnnouncement["tone"], string> = {
  ocean: "bg-ocean text-paper-strong",
  wave: "bg-wave text-ink",
  sun: "bg-sun text-ink",
  ink: "bg-ink text-paper-strong",
};

/** Dismissals are keyed per announcement id, so a new one always shows. */
const STORAGE_PREFIX = "aqua-announcement-dismissed:";

/**
 * `sessionStorage` isn't a reactive source, so dismissal is modelled as
 * an external store: `useSyncExternalStore` reads it without a
 * setState-in-effect, and dismissing notifies every mounted subscriber.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function readDismissed(id: string): boolean {
  try {
    return sessionStorage.getItem(`${STORAGE_PREFIX}${id}`) === "1";
  } catch {
    // Private mode / storage disabled — show the bar rather than hide it.
    return false;
  }
}

function writeDismissed(id: string): void {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, "1");
  } catch {
    // Non-fatal: the in-memory notify below still closes the bar.
  }
  listeners.forEach((l) => l());
}

/**
 * Top-of-page announcement strip, driven by `lewis_announcements` and
 * managed from /admin/site.
 *
 * Renders the highest-priority live announcement only — a stack of
 * banners above the hero pushes the actual page content off-screen on a
 * phone. Dismissal persists for the session, so it stays gone for the
 * visit but returns next time rather than being lost forever.
 *
 * The server snapshot is "not dismissed", so the bar ships in the
 * initial HTML for the common case (no layout shift, and it's readable
 * without JS). A visitor who already dismissed it this session sees it
 * disappear on hydration.
 */
export function AnnouncementBar({
  announcements,
}: {
  announcements: LewisAnnouncement[];
}) {
  const top = announcements[0];
  const id = top?.id ?? "";

  const getSnapshot = useCallback(
    () => (id ? readDismissed(id) : true),
    [id],
  );
  const getServerSnapshot = useCallback(() => false, []);

  const dismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!top || dismissed) return null;

  return (
    <div
      className={`border-b-[3px] border-ink ${TONE_CLASS[top.tone] ?? TONE_CLASS.sun}`}
    >
      <div className="max-w-[1300px] mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <span className="font-display text-[11px] md:text-[12px] tracking-wider">
          {top.title}
        </span>
        {top.body ? (
          <span className="text-[12px] md:text-[13px] opacity-90">
            {top.body}
          </span>
        ) : null}
        {top.href ? (
          <a
            href={top.href}
            className="font-display text-[11px] tracking-wider underline underline-offset-4 decoration-2"
          >
            {top.cta_label ?? "Find out more"} →
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => writeDismissed(top.id)}
          aria-label="Dismiss announcement"
          className="ml-auto font-display text-[14px] leading-none px-2 py-1 border-2 border-current rounded-sm"
        >
          ×
        </button>
      </div>
    </div>
  );
}
