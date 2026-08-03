"use client";

import { useState, useTransition } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/Form";
import { SectionCard } from "@/components/admin/SectionCard";
import {
  deleteAnnouncement,
  saveAnnouncement,
  setAnnouncementActive,
  type AnnouncementInput,
} from "@/app/_actions/site-content";
import type { AnnouncementTone, LewisAnnouncement } from "@/lib/supabase/types";

const TONES: { value: AnnouncementTone; label: string }[] = [
  { value: "sun", label: "Sun (gold)" },
  { value: "ocean", label: "Ocean (blue)" },
  { value: "wave", label: "Wave (light blue)" },
  { value: "ink", label: "Ink (black)" },
];

const TONE_SWATCH: Record<AnnouncementTone, string> = {
  sun: "bg-sun",
  ocean: "bg-ocean",
  wave: "bg-wave",
  ink: "bg-ink",
};

type Draft = {
  id?: string;
  title: string;
  body: string;
  href: string;
  cta_label: string;
  tone: AnnouncementTone;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
  sort: string;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  body: "",
  href: "",
  cta_label: "",
  tone: "sun",
  is_active: true,
  starts_at: "",
  ends_at: "",
  sort: "0",
};

/** ISO timestamp → the `YYYY-MM-DDTHH:mm` shape `datetime-local` wants. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function toDraft(a: LewisAnnouncement): Draft {
  return {
    id: a.id,
    title: a.title,
    body: a.body ?? "",
    href: a.href ?? "",
    cta_label: a.cta_label ?? "",
    tone: a.tone,
    is_active: a.is_active,
    starts_at: toLocalInput(a.starts_at),
    ends_at: toLocalInput(a.ends_at),
    sort: String(a.sort),
  };
}

function draftToInput(draft: Draft): AnnouncementInput {
  const text = (s: string) => (s.trim() ? s.trim() : null);
  const stamp = (s: string) => {
    if (!s.trim()) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };
  const sort = Number(draft.sort);
  return {
    ...(draft.id ? { id: draft.id } : {}),
    title: draft.title.trim(),
    body: text(draft.body),
    href: text(draft.href),
    cta_label: text(draft.cta_label),
    tone: draft.tone,
    is_active: draft.is_active,
    starts_at: stamp(draft.starts_at),
    ends_at: stamp(draft.ends_at),
    sort: Number.isFinite(sort) ? sort : 0,
  };
}

/** Human summary of an announcement's live window. */
function windowLabel(a: LewisAnnouncement): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (a.starts_at && a.ends_at) return `${fmt(a.starts_at)} → ${fmt(a.ends_at)}`;
  if (a.starts_at) return `From ${fmt(a.starts_at)}`;
  if (a.ends_at) return `Until ${fmt(a.ends_at)}`;
  return "Always";
}

/** Whether this row is what a visitor would see right now. */
function isLive(a: LewisAnnouncement): boolean {
  if (!a.is_active) return false;
  const now = Date.now();
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
  return true;
}

/**
 * Announcement manager.
 *
 * Only the top live announcement renders on the site (see
 * `AnnouncementBar`), so the list flags which row that will be — the
 * lowest `sort` among the live ones.
 */
export function AnnouncementsEditor({
  announcements,
  ready,
}: {
  announcements: LewisAnnouncement[];
  ready: boolean;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const liveIds = announcements.filter(isLive).map((a) => a.id);
  const showingId = liveIds[0];

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Something went wrong");
      else setDraft(null);
    });
  }

  return (
    <SectionCard
      eyebrow="Announcements"
      title="Announcement bar"
      actions={
        ready && !draft ? (
          <Button
            type="button"
            size="sm"
            variant="accent-sun"
            onClick={() => setDraft({ ...EMPTY_DRAFT })}
          >
            + New announcement
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[12px] text-secondary max-w-[76ch]">
          The bar sits above the header on the public page. Only the top live
          announcement is shown — set <em>sort</em> lower to promote one. A
          visitor can dismiss it for their session.
        </p>

        {error ? <p className="text-[12px] text-warn">{error}</p> : null}

        {draft ? (
          <div className="pop-card rounded-md p-4 flex flex-col gap-4 bg-paper">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Title" htmlFor="ann-title" className="lg:col-span-2">
                <Input
                  id="ann-title"
                  value={draft.title}
                  placeholder="Now open at the Metrocentre"
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </Field>

              <Field
                label="Body"
                htmlFor="ann-body"
                className="lg:col-span-2"
                hint="Optional supporting line."
              >
                <Textarea
                  id="ann-body"
                  rows={2}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />
              </Field>

              <Field label="Link URL" htmlFor="ann-href" hint="Optional.">
                <Input
                  id="ann-href"
                  type="url"
                  value={draft.href}
                  placeholder="https://…"
                  onChange={(e) => setDraft({ ...draft, href: e.target.value })}
                />
              </Field>

              <Field
                label="Link text"
                htmlFor="ann-cta"
                hint="Defaults to “Find out more”."
              >
                <Input
                  id="ann-cta"
                  value={draft.cta_label}
                  onChange={(e) =>
                    setDraft({ ...draft, cta_label: e.target.value })
                  }
                />
              </Field>

              <Field label="Colour" htmlFor="ann-tone">
                <Select
                  id="ann-tone"
                  value={draft.tone}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      tone: e.target.value as AnnouncementTone,
                    })
                  }
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Sort"
                htmlFor="ann-sort"
                hint="Lower wins when several are live."
              >
                <Input
                  id="ann-sort"
                  type="number"
                  value={draft.sort}
                  onChange={(e) => setDraft({ ...draft, sort: e.target.value })}
                />
              </Field>

              <Field
                label="Starts"
                htmlFor="ann-starts"
                hint="Leave blank to start immediately."
              >
                <Input
                  id="ann-starts"
                  type="datetime-local"
                  value={draft.starts_at}
                  onChange={(e) =>
                    setDraft({ ...draft, starts_at: e.target.value })
                  }
                />
              </Field>

              <Field
                label="Ends"
                htmlFor="ann-ends"
                hint="Leave blank to run indefinitely."
              >
                <Input
                  id="ann-ends"
                  type="datetime-local"
                  value={draft.ends_at}
                  onChange={(e) =>
                    setDraft({ ...draft, ends_at: e.target.value })
                  }
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 w-fit">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) =>
                  setDraft({ ...draft, is_active: e.target.checked })
                }
                className="w-4 h-4 accent-[var(--color-ocean)]"
              />
              <span className="font-display text-[11px] tracking-wider">
                Active
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={pending || !draft.title.trim()}
                onClick={() => run(() => saveAnnouncement(draftToInput(draft)))}
              >
                {pending ? "Saving…" : draft.id ? "Save changes" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setDraft(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {announcements.length === 0 ? (
          <p className="text-[13px] text-muted">
            {ready
              ? "No announcements yet."
              : "Apply migration 0014 to start using announcements."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {announcements.map((a) => {
              const live = isLive(a);
              return (
                <li
                  key={a.id}
                  className="pop-card rounded-md p-3 flex flex-wrap items-center gap-3"
                >
                  <span
                    aria-hidden
                    className={`w-4 h-4 rounded-sm border-2 border-ink shrink-0 ${TONE_SWATCH[a.tone]}`}
                  />
                  <div className="flex flex-col gap-0.5 min-w-[200px] flex-1">
                    <span className="font-display text-[13px] tracking-tight">
                      {a.title}
                    </span>
                    <span className="text-[11px] text-muted">
                      {windowLabel(a)} · sort {a.sort}
                    </span>
                  </div>

                  {a.id === showingId ? (
                    <span className="font-display text-[10px] tracking-widest bg-ocean text-paper-strong border-2 border-ink px-2 py-1 rounded-sm">
                      ON SITE
                    </span>
                  ) : live ? (
                    <span className="font-display text-[10px] tracking-widest bg-paper border-2 border-ink px-2 py-1 rounded-sm">
                      LIVE
                    </span>
                  ) : (
                    <span className="font-display text-[10px] tracking-widest text-muted border-2 border-ink/20 px-2 py-1 rounded-sm">
                      {a.is_active ? "SCHEDULED" : "OFF"}
                    </span>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => setDraft(toDraft(a))}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        run(() => setAnnouncementActive(a.id, !a.is_active))
                      }
                    >
                      {a.is_active ? "Turn off" : "Turn on"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() => run(() => deleteAnnouncement(a.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}
