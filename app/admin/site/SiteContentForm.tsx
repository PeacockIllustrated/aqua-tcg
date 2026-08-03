"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui/Form";
import { SectionCard } from "@/components/admin/SectionCard";
import { saveSiteContent } from "@/app/_actions/site-content";
import { FIELDS, GROUPS, type ContentField } from "@/lib/marketing/content";

type Props = {
  /** Only the keys that have actually been overridden. */
  overrides: Record<string, string>;
  /** False when migration 0014 hasn't been applied — saving is disabled. */
  ready: boolean;
};

/**
 * Editor for the marketing one-pager's copy.
 *
 * Inputs hold ONLY the override, never the default. An empty box means
 * "using the built-in copy", and the default is shown underneath as
 * placeholder text — so clearing a field is an obvious, reversible way
 * to revert rather than a way to blank a section of the site.
 */
export function SiteContentForm({ overrides, ready }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of FIELDS) initial[field.key] = overrides[field.key] ?? "";
    return initial;
  });
  const [saved, setSaved] = useState<Record<string, string>>(() => ({
    ...overrides,
  }));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      FIELDS.some((f) => (values[f.key] ?? "") !== (saved[f.key] ?? "")),
    [values, saved],
  );

  const byGroup = useMemo(() => {
    const map = new Map<string, ContentField[]>();
    for (const field of FIELDS) {
      const list = map.get(field.group) ?? [];
      list.push(field);
      map.set(field.group, list);
    }
    return map;
  }, []);

  const unverifiedOutstanding = FIELDS.filter(
    (f) => f.unverified && !(values[f.key] ?? "").trim(),
  );

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveSiteContent(values);
      if (!result.ok) {
        setError(result.error ?? "Could not save");
        return;
      }
      // Mirror the server's normalisation: blanks were deleted, so the
      // saved snapshot keeps only non-empty values. Without this the
      // dirty check would immediately re-flag every cleared field.
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        const trimmed = value.trim();
        if (trimmed) next[key] = trimmed;
      }
      setSaved(next);
      setSavedAt(new Date().toLocaleTimeString("en-GB"));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {!ready ? (
        <div className="pop-card rounded-md p-4 border-warn bg-paper-strong">
          <p className="text-[13px] text-ink">
            <strong className="font-display tracking-wider">
              CMS tables not found.
            </strong>{" "}
            Apply <code className="text-[12px]">0014_marketing_cms.sql</code> in
            the Supabase SQL editor (or via{" "}
            <code className="text-[12px]">supabase db push</code>) before
            editing. The public page is rendering its built-in defaults in the
            meantime — nothing is broken, it just can&apos;t be changed from
            here yet.
          </p>
        </div>
      ) : null}

      {unverifiedOutstanding.length > 0 ? (
        <div className="pop-card rounded-md p-4 bg-sun">
          <p className="text-[13px] text-ink">
            <strong className="font-display tracking-wider">
              {unverifiedOutstanding.length} field
              {unverifiedOutstanding.length === 1 ? "" : "s"} need checking.
            </strong>{" "}
            These couldn&apos;t be confirmed when the page was built, so they
            are blank and their sections are hidden on the live site:{" "}
            {unverifiedOutstanding.map((f) => f.label).join(", ")}.
          </p>
        </div>
      ) : null}

      {GROUPS.map((group) => {
        const fields = byGroup.get(group);
        if (!fields || fields.length === 0) return null;
        return (
          <SectionCard key={group} eyebrow="Section" title={group}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fields.map((field) => {
                const id = `content-${field.key}`;
                const isOverridden = Boolean((values[field.key] ?? "").trim());
                return (
                  <Field
                    key={field.key}
                    label={field.label}
                    htmlFor={id}
                    className={field.kind === "textarea" ? "lg:col-span-2" : ""}
                    hint={
                      <span className="flex flex-col gap-0.5">
                        {field.help ? <span>{field.help}</span> : null}
                        <span className="text-muted/80">
                          {isOverridden
                            ? "Overridden — clear to restore the default."
                            : field.value
                              ? "Using the built-in default."
                              : "Empty — this block is hidden on the live site."}
                        </span>
                      </span>
                    }
                  >
                    {field.kind === "textarea" ? (
                      <Textarea
                        id={id}
                        rows={3}
                        value={values[field.key] ?? ""}
                        placeholder={field.value || "Not set"}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <Input
                        id={id}
                        type={
                          field.kind === "url"
                            ? "url"
                            : field.kind === "email"
                              ? "email"
                              : "text"
                        }
                        value={values[field.key] ?? ""}
                        placeholder={field.value || "Not set"}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          </SectionCard>
        );
      })}

      <div className="sticky bottom-0 z-10 pop-card rounded-md p-3 flex flex-wrap items-center gap-3 bg-paper-strong">
        <Button
          type="button"
          onClick={onSave}
          disabled={!ready || !dirty || pending}
        >
          {pending ? "Saving…" : "Save copy"}
        </Button>
        {dirty ? (
          <span className="font-display text-[11px] tracking-wider text-muted">
            Unsaved changes
          </span>
        ) : savedAt ? (
          <span className="font-display text-[11px] tracking-wider text-muted">
            Saved at {savedAt}
          </span>
        ) : null}
        {error ? (
          <span className="text-[12px] text-warn">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
