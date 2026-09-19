-- Fixes for the 3 pre-existing free-text-subcategory rows flagged as
-- "still open" in docs/seo/category-migration-diff.md ("Needs manual
-- review" section) and re-confirmed still broken during this session's
-- verification pass. Final decisions below are the user's calls, not
-- defaults.
--
-- Run the SELECT first to confirm these are still the 3 rows expected,
-- then the UPDATE block. Both wrapped in one transaction.

begin;

select id, name, slug, category, subcategory
from businesses
where slug in ('green-pages-pk', 'leaosagitrades', 'experts-force-corporation')
order by slug;

-- 1. Green Pages Pk — category was "Professional Services" (wrong parent)
--    with subcategory "Digital Marketing Agency" (not a real child of that
--    parent). It's a directory plus digital marketing agency — web
--    development is one service, not the business — so this lands on
--    Technology & Digital's real "Digital Marketing & SEO Agencies" child,
--    not Web Development Agencies.
update businesses
set category = 'Technology & Digital',
    subcategory = 'Digital Marketing & SEO Agencies'
where slug = 'green-pages-pk'
  and category = 'Professional Services'
  and subcategory = 'Digital Marketing Agency';

-- 2. LeaosagiTrades — category "Financial Services" is the right parent;
--    subcategory "Financial service" was free text. Left NULL (parent-only)
--    rather than "Investment & Wealth Advisors" — that label means a
--    licensed advisory firm, and this is a forex signals/mentorship group;
--    someone browsing that page for an actual advisor would be misled.
update businesses
set subcategory = null
where slug = 'leaosagitrades'
  and category = 'Financial Services'
  and subcategory = 'Financial service';

-- 3. Experts Force Corporation — category was "Professional Services"
--    (wrong parent) with a full-sentence subcategory. This is a multi-trade
--    property maintenance business (AC, electrical, plumbing, CCTV, solar,
--    appliances) — moved to the right parent, Home Services & Repair, with
--    subcategory left NULL rather than picking one trade that misrepresents
--    the rest. If you'd rather pick one, "AC Repair & HVAC" was listed
--    first in their own description.
update businesses
set category = 'Home Services & Repair',
    subcategory = null
where slug = 'experts-force-corporation'
  and category = 'Professional Services'
  and subcategory = 'Property Maintenance, AC, electrical, plumbing, CCTV, solar, appliances, and general maintenance.';

-- Verify: category/subcategory should now be real getParent()/getChild()
-- values from app/data/businessCategories.js for all 3.
select id, name, slug, category, subcategory
from businesses
where slug in ('green-pages-pk', 'leaosagitrades', 'experts-force-corporation')
order by slug;

commit;
