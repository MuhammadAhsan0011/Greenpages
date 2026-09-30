-- Adds 'draft' as a valid articles.status value, for the new "Save as Draft"
-- option on the article submission form (app/account/articles/new/page.js).
-- A draft is never public: app/blog/page.js and every other public listing
-- filter on `approved = true`, and drafts are always inserted with
-- `approved = false` (see saveArticleDraft in app/account/articles/actions.js),
-- so this migration alone can't leak unfinished drafts onto the live site.
--
-- Run this once in the Supabase SQL editor. Safe to re-run: both statements
-- use IF EXISTS/OR REPLACE-equivalent guards where Postgres allows it.

begin;

alter table public.articles drop constraint if exists articles_status_check;

alter table public.articles add constraint articles_status_check
  check (status in ('draft', 'pending_review', 'changes_requested', 'rejected', 'published', 'unpublished'));

commit;
