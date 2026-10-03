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

-- Backfill: anyone who already wrote an article under the old per-article
-- author form already typed a bio/photo/phone once — reuse the most recent
-- one (per author) instead of making them re-enter it before their first
-- article under the new required-author-profile gate (see the redirect in
-- app/account/articles/new/page.js). `distinct on` picks one row per
-- author_id, newest first; `b.author_bio is null` makes this safe to re-run
-- without clobbering anything already set via the new author-profile page.
update public.businesses b
set
  author_bio = a.author_bio,
  author_photo_url = a.author_photo_url,
  author_phone = a.author_phone
from (
  select distinct on (author_id)
    author_id, author_bio, author_photo_url, author_phone
  from public.articles
  where author_bio is not null and author_bio <> ''
  order by author_id, created_at desc
) a
where b.owner_id = a.author_id
  and b.author_bio is null;

-- Verify: every business that had a past article with a bio should now show
-- one here too (new signups with no articles yet correctly show null —
-- they fill it in themselves on their first visit to the author-profile page).
select id, name, owner_id, author_bio, author_photo_url, author_phone
from public.businesses
order by created_at desc;

commit;
