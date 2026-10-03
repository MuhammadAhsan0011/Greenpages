-- Adds the annual "Publisher Plan" (Basic/Featured/Sponsored) that replaces
-- the old per-article Free/Featured/Sponsored payment — see
-- app/account/articles/actions.js and app/data/plans.js. A business's
-- publisher_plan now controls both the submission cadence cap (basic: 1
-- article / 7 days, featured: 1 / day, sponsored: 3 / day — enforced in
-- createArticle) and the rel="sponsored" / link-count behavior that used to
-- come from a per-article choice (articles.submission_plan is still read by
-- lib/seo/articleLinks.js exactly as before — it's now just derived from
-- publisher_plan at submit time instead of chosen+paid per article).
--
-- Also adds the one-time "author profile" fields (bio/photo/phone) so an
-- author fills these in once instead of re-typing them on every article —
-- see app/account/articles/author-profile/page.js.
--
-- Run once in the Supabase SQL editor.

begin;

alter table public.businesses
  add column publisher_plan text not null default 'basic'
    check (publisher_plan in ('basic', 'featured', 'sponsored')),
  add column requested_publisher_plan text
    check (requested_publisher_plan in ('featured', 'sponsored')),
  add column publisher_plan_started_at timestamptz,
  add column author_bio text,
  add column author_photo_url text,
  add column author_phone text;

commit;
