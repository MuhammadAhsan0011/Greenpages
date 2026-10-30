-- Advertisement Manager: own affiliate/sponsored banners (separate from the
-- Adsterra units, which are untouched). Run once in the Supabase SQL Editor.
--
-- Tables
--   ad_slots        one row per placement on the site (header, blog-sidebar, ...)
--   ads             the banners themselves (image + affiliate URL + schedule)
--   ad_stats_daily  impressions/clicks per ad, per placement, per day (PKT)
-- Plus record_ad_event() so anonymous visitors can add to the counters
-- without being able to read or change anything else, and three
-- security_invoker views the admin analytics page reads.
--
-- The admin email below must match ADMIN_EMAIL and the other admin policies
-- in supabase/schema.sql. Safe to re-run: everything is "if not exists" /
-- "drop ... if exists".

begin;

-- ---------------------------------------------------------------- slots
create table if not exists public.ad_slots (
  key text primary key,
  label text not null,
  description text,
  enabled boolean not null default true,
  -- Size keys this placement accepts (see AD_SIZES in lib/ads.js, plus
  -- 'responsive' and 'custom'). Empty = accepts any size.
  allowed_sizes text[] not null default '{}',
  show_desktop boolean not null default true,
  show_tablet boolean not null default true,
  show_mobile boolean not null default true,
  -- How many ads this placement shows at once.
  max_ads integer not null default 1 check (max_ads between 1 and 6),
  -- off      = highest priority first, no rotation
  -- priority = weighted random, higher priority shown more often
  -- random   = every eligible ad equally likely
  rotation text not null default 'priority' check (rotation in ('off', 'priority', 'random')),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ ads
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  advertiser text not null,
  image_url text not null,
  -- Exactly what the admin pasted, tracking parameters included. Only ever
  -- used by the /ad/click redirect; never sent to the browser in page data.
  target_url text not null check (target_url ~* '^https?://'),
  ad_type text not null default 'affiliate' check (ad_type in ('affiliate', 'sponsored', 'house')),
  size_key text not null,
  width integer not null check (width between 20 and 2000),
  height integer not null check (height between 20 and 2000),
  slot_key text not null references public.ad_slots (key) on update cascade,
  start_date date not null default current_date,
  end_date date,
  priority integer not null default 5 check (priority between 1 and 10),
  status text not null default 'active' check (status in ('active', 'inactive')),
  open_in_new_tab boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists ads_slot_status_idx on public.ads (slot_key, status);

-- --------------------------------------------------------------- stats
create table if not exists public.ad_stats_daily (
  ad_id uuid not null references public.ads (id) on delete cascade,
  slot_key text not null,
  day date not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  primary key (ad_id, slot_key, day)
);

create index if not exists ad_stats_daily_day_idx on public.ad_stats_daily (day);

-- ------------------------------------------------------------------ RLS
alter table public.ad_slots enable row level security;
alter table public.ads enable row level security;
alter table public.ad_stats_daily enable row level security;

drop policy if exists "Ad slots are publicly readable" on public.ad_slots;
create policy "Ad slots are publicly readable"
  on public.ad_slots for select using (true);

drop policy if exists "Admin can manage ad slots" on public.ad_slots;
create policy "Admin can manage ad slots"
  on public.ad_slots for all
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com')
  with check (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- Visitors only ever see active ads (inactive ones, and every draft the admin
-- is still preparing, stay private).
drop policy if exists "Active ads are publicly readable" on public.ads;
create policy "Active ads are publicly readable"
  on public.ads for select using (status = 'active');

drop policy if exists "Admin can manage ads" on public.ads;
create policy "Admin can manage ads"
  on public.ads for all
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com')
  with check (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

drop policy if exists "Admin can read ad stats" on public.ad_stats_daily;
create policy "Admin can read ad stats"
  on public.ad_stats_daily for select
  using (auth.jwt() ->> 'email' = 'muhammadahsan3541@gmail.com');

-- ------------------------------------------------------ counting events
-- The only way visitors can write to ad_stats_daily. Ignores anything that
-- isn't a real, active ad on a real placement, so a forged request can't
-- create rows. Days are Pakistan time, to match how the admin reads them.
create or replace function public.record_ad_event(p_ad uuid, p_slot text, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind not in ('impression', 'click') then
    return;
  end if;
  if not exists (select 1 from public.ads where id = p_ad and status = 'active') then
    return;
  end if;
  if not exists (select 1 from public.ad_slots where key = p_slot) then
    return;
  end if;

  insert into public.ad_stats_daily (ad_id, slot_key, day, impressions, clicks)
  values (
    p_ad,
    p_slot,
    (now() at time zone 'Asia/Karachi')::date,
    case when p_kind = 'impression' then 1 else 0 end,
    case when p_kind = 'click' then 1 else 0 end
  )
  on conflict (ad_id, slot_key, day) do update
    set impressions = public.ad_stats_daily.impressions + excluded.impressions,
        clicks = public.ad_stats_daily.clicks + excluded.clicks;
end;
$$;

revoke all on function public.record_ad_event(uuid, text, text) from public;
grant execute on function public.record_ad_event(uuid, text, text) to anon, authenticated;

-- -------------------------------------------------- analytics aggregates
-- security_invoker: these views obey the caller's RLS, so only the admin
-- (the only role allowed to read ad_stats_daily) can see anything through them.
create or replace view public.ad_totals with (security_invoker = true) as
  select ad_id, sum(impressions)::bigint as impressions, sum(clicks)::bigint as clicks
  from public.ad_stats_daily group by ad_id;

create or replace view public.ad_slot_totals with (security_invoker = true) as
  select slot_key, sum(impressions)::bigint as impressions, sum(clicks)::bigint as clicks
  from public.ad_stats_daily group by slot_key;

create or replace view public.ad_daily_totals with (security_invoker = true) as
  select day, sum(impressions)::bigint as impressions, sum(clicks)::bigint as clicks
  from public.ad_stats_daily group by day;

-- -------------------------------------------------------- default slots
-- One per real place in the layout (see <AdSlot slot="..." /> in the app).
-- A homepage "sidebar" placement is deliberately not here: the homepage has
-- no sidebar, so there is nowhere to put one without redesigning it.
insert into public.ad_slots (key, label, description, allowed_sizes, max_ads, sort_order) values
  ('header', 'Header area', 'A slim strip above the main navigation, on every page.',
    '{leaderboard,mobile-banner,responsive,custom}', 1, 10),
  ('below-nav', 'Below main navigation', 'Under the navigation bar (after the Adsterra banner), on every page.',
    '{leaderboard,billboard,mobile-banner,responsive,custom}', 1, 20),
  ('home-content', 'Homepage - content (upper)', 'Between the homepage sections, after "How it works".',
    '{leaderboard,billboard,mobile-banner,responsive,custom}', 1, 30),
  ('home-content-2', 'Homepage - content (lower)', 'Between the homepage sections, after "Services".',
    '{leaderboard,billboard,mobile-banner,responsive,custom}', 1, 35),
  ('blog-list', 'Blog listing - top', 'Above the article grid on /blog.',
    '{leaderboard,billboard,mobile-banner,responsive,custom}', 1, 40),
  ('blog-between-posts', 'Between blog posts', 'A full-width row inside the /blog article grid, after the third card.',
    '{leaderboard,billboard,mobile-banner,responsive,custom}', 1, 50),
  ('blog-sidebar', 'Blog article sidebar', 'Sidebar of every blog article, above the Adsterra skyscraper.',
    '{medium-rectangle,large-rectangle,wide-skyscraper,skyscraper,square,responsive,custom}', 2, 60),
  ('article-inline', 'Inside blog article content', 'After the third paragraph of an article (articles with at least five).',
    '{leaderboard,medium-rectangle,large-rectangle,mobile-banner,square,responsive,custom}', 1, 70),
  ('above-footer', 'Above footer', 'Between the page content and the footer, on every page.',
    '{leaderboard,billboard,mobile-banner,responsive,custom}', 1, 80),
  ('archive-top', 'Category and archive pages', 'Above the results on business and blog category / city pages.',
    '{leaderboard,billboard,mobile-banner,responsive,custom}', 1, 90)
on conflict (key) do nothing;

commit;

-- Check: expect 10 rows.
select key, label, enabled, allowed_sizes, max_ads from public.ad_slots order by sort_order;
