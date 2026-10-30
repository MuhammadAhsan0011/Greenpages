-- Adds the "scrolling row" display mode to ad placements, and a placement for
-- the /businesses page that uses it (replacing the "Browse by City" row while
-- it has ads). Run once in the Supabase SQL Editor, AFTER ads-migration.sql.
-- Safe to re-run.

begin;

-- static = show the chosen ad(s) in place (what every placement did until now)
-- ticker = ads loop sideways in a row and pause when the cursor is over them
alter table public.ad_slots
  add column if not exists display_mode text not null default 'static'
  check (display_mode in ('static', 'ticker'));

-- A scrolling row can carry far more than 6 banners.
alter table public.ad_slots drop constraint if exists ad_slots_max_ads_check;
alter table public.ad_slots add constraint ad_slots_max_ads_check check (max_ads between 1 and 20);

insert into public.ad_slots (key, label, description, allowed_sizes, max_ads, rotation, display_mode, sort_order)
values (
  'businesses-ticker',
  'Businesses page - scrolling row',
  'Takes the place of the "Browse by City" row on /businesses: banners loop sideways and pause on hover. The city row comes back by itself when no ad is eligible.',
  '{}',
  12,
  'priority',
  'ticker',
  45
)
on conflict (key) do nothing;

commit;

-- Check: expect 11 rows, businesses-ticker with display_mode = ticker.
select key, label, enabled, display_mode, max_ads from public.ad_slots order by sort_order;
