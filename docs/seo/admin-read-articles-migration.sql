-- Lets the admin account SEE every article, including other people's
-- pending_review ones, so they appear under /admin -> "Pending Articles" and
-- can be approved or rejected.
--
-- Why it was missing: the articles table only allowed reading (1) published
-- articles and (2) your own articles. "Admin can update any article" and
-- "Admin can delete any article" exist, but an update/delete can only act on
-- a row the admin is allowed to read, and the admin's list page could not
-- read other authors' unpublished rows at all.
--
-- Run once in the Supabase SQL Editor. Safe to re-run. Select policies are
-- combined with OR, so this only ADDS access for the admin email; nobody else
-- gains anything.

drop policy if exists "Admin can read all articles" on public.articles;

create policy "Admin can read all articles"
  on public.articles for select
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- Check 1: the policy is there.
select policyname, cmd from pg_policies
where schemaname = 'public' and tablename = 'articles'
order by policyname;

-- Check 2 (optional): every article that is waiting for review, newest first.
-- Run it in the SQL Editor (it ignores row-level security) to confirm the
-- article you submitted exists and is in 'pending_review'.
select id, title, status, approved, author_email, created_at
from public.articles
where status = 'pending_review'
order by created_at desc;
