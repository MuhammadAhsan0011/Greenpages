-- Moves the one-time author profile (bio / photo / phone) off `businesses`
-- into its own per-user table, so a user can write articles without having
-- created a business listing. See lib/authorProfile.js and
-- app/account/articles/actions.js.
--
-- Deliberately NOT added to `profiles`: that table is publicly readable
-- (select using true), and the author phone must stay private. This table is
-- owner-only. The public bio/photo shown on articles is copied onto the
-- article row itself at submit time (articles.author_bio / author_photo_url),
-- exactly as before.
--
-- businesses.author_* columns are left in place (the business page still
-- reads them); the app keeps them in sync when the author also has a business.
--
-- Run once in the Supabase SQL editor, BEFORE deploying the matching code.

begin;

create table if not exists public.author_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  photo_url text,
  phone text,
  updated_at timestamptz not null default now()
);

alter table public.author_profiles enable row level security;

create policy "Users can read their own author profile"
  on public.author_profiles for select
  using (auth.uid() = user_id);

create policy "Users can create their own author profile"
  on public.author_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own author profile"
  on public.author_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Backfill: anyone who already set a bio on their business keeps it.
insert into public.author_profiles (user_id, bio, photo_url, phone)
select owner_id, author_bio, author_photo_url, author_phone
from public.businesses
where author_bio is not null and author_bio <> ''
on conflict (user_id) do nothing;

-- Verify
select count(*) as backfilled from public.author_profiles;

commit;
