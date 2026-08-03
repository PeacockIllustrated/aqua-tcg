-- ================================================================
-- 0014 · Marketing CMS — editable site copy + announcements
--
-- The public one-pager at `/` renders from hardcoded defaults in
-- `lib/marketing/content.ts`. These two tables let Lewis override
-- that copy and run announcements from /admin/site without a deploy.
--
-- Design notes:
--   • `lewis_site_content` is a flat key/value store. The *set* of
--     keys is owned by the code (defaults + field metadata live in
--     lib/marketing/content.ts); this table only carries overrides.
--     A missing row means "use the code default", so the site never
--     depends on this table existing.
--   • `lewis_announcements` is a proper row-per-announcement table
--     with an optional live window. Anonymous readers can only see
--     announcements that are active AND inside their window — drafts
--     and expired entries never leave the database.
--
-- Depends on: 0004 (public.is_admin), 0010 (lewis_touch_updated_at).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. lewis_site_content — key/value overrides for marketing copy
-- ----------------------------------------------------------------
create table if not exists lewis_site_content (
  key         text primary key,
  value       text not null default '',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

comment on table lewis_site_content is
  'Overrides for marketing copy. Missing key = use the code default in lib/marketing/content.ts.';

do $$ begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'lewis_site_content_touch'
      and n.nspname = 'public' and c.relname = 'lewis_site_content'
  ) then
    create trigger lewis_site_content_touch
      before update on lewis_site_content
      for each row execute function lewis_touch_updated_at();
  end if;
end $$;

-- ----------------------------------------------------------------
-- 2. lewis_announcements — the site-wide announcement bar
-- ----------------------------------------------------------------
create table if not exists lewis_announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text,
  href        text,
  cta_label   text,
  tone        text not null default 'sun'
              check (tone in ('ocean', 'wave', 'sun', 'ink')),
  is_active   boolean not null default true,
  -- Optional live window. NULL on either side means "unbounded".
  starts_at   timestamptz,
  ends_at     timestamptz,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null
);

comment on table lewis_announcements is
  'Announcement bar entries for the public one-pager. Anon read is scoped to live entries only.';

create index if not exists lewis_announcements_live_idx
  on lewis_announcements (is_active, sort, created_at desc);

do $$ begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'lewis_announcements_touch'
      and n.nspname = 'public' and c.relname = 'lewis_announcements'
  ) then
    create trigger lewis_announcements_touch
      before update on lewis_announcements
      for each row execute function lewis_touch_updated_at();
  end if;
end $$;

-- ----------------------------------------------------------------
-- 3. RLS
--
-- Site content is public-read (it is, literally, the public page) and
-- admin-write. Announcements are public-read ONLY where live, so an
-- unpublished or scheduled entry can't be scraped ahead of time; the
-- separate admin policy gives /admin/site the full list.
-- ----------------------------------------------------------------
alter table lewis_site_content enable row level security;
alter table lewis_announcements enable row level security;

drop policy if exists "lewis_site_content: public read" on public.lewis_site_content;
create policy "lewis_site_content: public read"
  on public.lewis_site_content for select
  to anon, authenticated
  using (true);

drop policy if exists "lewis_site_content: admin write" on public.lewis_site_content;
create policy "lewis_site_content: admin write"
  on public.lewis_site_content for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "lewis_announcements: public read live" on public.lewis_announcements;
create policy "lewis_announcements: public read live"
  on public.lewis_announcements for select
  to anon, authenticated
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "lewis_announcements: admin all" on public.lewis_announcements;
create policy "lewis_announcements: admin all"
  on public.lewis_announcements for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ================================================================
-- No seed rows.
--
-- Deliberate: `lib/marketing/content.ts` is the source of truth for
-- default copy, and an empty table means every field falls through to
-- it. Seeding here would fork the defaults into two places and make a
-- code-side copy change silently ineffective.
-- ================================================================
