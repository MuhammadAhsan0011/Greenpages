-- Adds the homepage placement that sits between "Popular & Verified Listings"
-- and "Featured Articles": up to 3 ads side by side, each the size of a
-- listing card (stacked one under another on phones). Run once in the
-- Supabase SQL Editor. Safe to re-run; until it is run the homepage simply
-- shows nothing there.

insert into public.ad_slots (key, label, description, allowed_sizes, max_ads, rotation, display_mode, sort_order)
values (
  'home-listings-ads',
  'Homepage - between listings and articles (1-3 ads)',
  'A row of up to 3 ad boxes, each the size of a listing card, between "Popular & Verified Listings" and "Featured Articles" on the homepage. Add 1, 2 or 3 ads here and they sit side by side. Best size: Listing Card (360 x 300) or any similar shape.',
  '{}',
  3,
  'priority',
  'static',
  32
)
on conflict (key) do nothing;

select key, label, max_ads, display_mode from public.ad_slots where key = 'home-listings-ads';
