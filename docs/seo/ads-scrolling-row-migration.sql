-- Renames the scrolling-row placement for the admin screens, now that it is
-- shared by several pages (Home, About, Services and Businesses) instead of
-- just /businesses. Only the label/description change - the placement key
-- ('businesses-ticker') stays, so existing ads and their statistics are
-- untouched. Optional and cosmetic: the site works without running it.
-- Safe to re-run.

update public.ad_slots
set label = 'Scrolling row (Home, About, Services, Businesses)',
    description = 'One looping, pause-on-hover row of banners shown on the Home, About, Services and Businesses pages (right under the page header). Add an ad here once and it appears on all of them. Nothing shows when no ad is eligible.',
    sort_order = 25
where key = 'businesses-ticker';

select key, label, display_mode from public.ad_slots where key = 'businesses-ticker';
