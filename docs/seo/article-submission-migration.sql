-- Adds the columns the expanded "Write an Article" form needs (author info,
-- website/link info, per-article publishing plan, richer status, payment
-- status). Purely additive — `approved` and `published_at` keep their exact
-- current meaning and keep driving every existing RLS policy, the sitemap,
-- and blog rendering untouched. No existing column is renamed or dropped, no
-- RLS policy changes: "Admin can update any article" already covers every
-- new admin action, since they're all just updates to a row the admin
-- already has update rights to.
--
-- Run the whole thing in the Supabase SQL editor in one go (wrapped in a
-- transaction below). Safe to run once; re-running will error on the
-- `add column` statements for columns that already exist (Postgres has no
-- built-in "add column if not exists" list form, so don't run this twice).

begin;

alter table public.articles
  add column author_name text,
  add column author_email text,
  add column author_phone text,
  add column company_name text,
  add column author_bio text,
  add column author_photo_url text,
  add column target_city text,
  add column image_credit text,
  add column website_url text,
  add column business_name text,
  add column target_url text,
  add column anchor_text text,
  add column submission_plan text not null default 'free'
    check (submission_plan in ('free', 'featured', 'sponsored')),
  add column link_count integer not null default 0,
  add column status text not null default 'pending_review'
    check (status in ('pending_review', 'changes_requested', 'rejected', 'published', 'unpublished')),
  add column payment_status text not null default 'not_required'
    check (payment_status in ('not_required', 'pending', 'confirmed')),
  add column rejection_reason text,
  add column admin_notes text,
  add column reviewed_at timestamptz;

-- Backfill status for every article that already existed before this
-- migration, so it stays consistent with the `approved` value it already
-- has (this is the only place `status` is derived from `approved` instead
-- of the other way around — new code always sets both together).
update public.articles set status = 'published' where approved = true;
update public.articles set status = 'pending_review' where approved = false;

-- Verify: every row's status/approved pair should now make sense together,
-- and the new columns should all be present with sane defaults.
select id, slug, approved, status, payment_status, submission_plan, link_count
from public.articles
order by created_at desc;

commit;
