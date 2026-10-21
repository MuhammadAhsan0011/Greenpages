-- Moves the annual Publisher Plan (plan / requested plan / start date) from
-- `businesses` onto `author_profiles`, so a user can buy or request a
-- Publisher Plan without creating a business listing. Builds on
-- author-profile-table-migration.sql (run that first).
--
-- Users must never be able to grant themselves a plan, but they do need to
-- create their row and set `requested_publisher_plan`. RLS can't restrict
-- individual columns, so a trigger pins publisher_plan and
-- publisher_plan_started_at for everyone except the admin (and the SQL
-- editor / service role, where auth.uid() is null).
--
-- businesses.publisher_plan* columns are left in place and no longer read
-- once the matching code is deployed (the code falls back to them only when a
-- user has no author_profiles row).
--
-- Run once in the Supabase SQL editor, BEFORE deploying the matching code.

begin;

alter table public.author_profiles
  add column if not exists publisher_plan text not null default 'basic'
    check (publisher_plan in ('basic', 'featured', 'sponsored')),
  add column if not exists requested_publisher_plan text
    check (requested_publisher_plan in ('featured', 'sponsored')),
  add column if not exists publisher_plan_started_at timestamptz;

create or replace function public.protect_publisher_plan()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null
     and coalesce(auth.jwt() ->> 'email', '') <> 'muhammadahsan3541@gmail.com' then
    if tg_op = 'INSERT' then
      new.publisher_plan := 'basic';
      new.publisher_plan_started_at := null;
    else
      new.publisher_plan := old.publisher_plan;
      new.publisher_plan_started_at := old.publisher_plan_started_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_publisher_plan on public.author_profiles;
create trigger protect_publisher_plan
  before insert or update on public.author_profiles
  for each row execute function public.protect_publisher_plan();

create policy "Admin can read all author profiles"
  on public.author_profiles for select
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Admin can create any author profile"
  on public.author_profiles for insert
  with check (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

create policy "Admin can update any author profile"
  on public.author_profiles for update
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- Backfill from businesses: anyone with a non-basic plan or a pending
-- request keeps it; users with a business but no author_profiles row yet get
-- one (bio stays null, so they still set it up before writing).
insert into public.author_profiles
  (user_id, publisher_plan, requested_publisher_plan, publisher_plan_started_at)
select owner_id, publisher_plan, requested_publisher_plan, publisher_plan_started_at
from public.businesses
where publisher_plan <> 'basic' or requested_publisher_plan is not null
on conflict (user_id) do update set
  publisher_plan = excluded.publisher_plan,
  requested_publisher_plan = excluded.requested_publisher_plan,
  publisher_plan_started_at = excluded.publisher_plan_started_at;

-- Verify
select user_id, publisher_plan, requested_publisher_plan from public.author_profiles
where publisher_plan <> 'basic' or requested_publisher_plan is not null;

commit;
