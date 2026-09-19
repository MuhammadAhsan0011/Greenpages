-- Data-quality cleanup for the 16 businesses that signed up through the OLD,
-- unvalidated form (deployed on main before today's merge) while it was
-- accepting old pre-migration category names with no taxonomy check.
-- Discovered during a post-deploy audit of all 59 live rows against the
-- real taxonomy (app/data/businessCategories.js). Excludes `ganzay`
-- (deliberately uncategorized, needs_review=true, see
-- category-migration-diff.md) and the 3 rows already covered by
-- three-miscategorized-fix.sql (green-pages-pk, leaosagitrades,
-- experts-force-corporation).
--
-- Confidence varies per row — see the comment above each UPDATE. Several
-- are a judgment call from the business name/description alone; review
-- before running, especially the ones marked LOW CONFIDENCE.
--
-- Run the SELECT first to confirm these are still the 16 rows expected,
-- then the UPDATE block. Both wrapped in one transaction.

begin;

select id, name, slug, category, subcategory
from businesses
where slug in (
  'faisal-hills',
  'hotel-the-oriel-islamabad',
  'nz-electrician-services',
  'islamabad-pain-spine-stroke-center',
  'orient-energy-system',
  'elijah-health-care',
  'wearing-parlour',
  'seo-services-in-pakistan',
  'boostrankify-affordable-professional-seo-agency',
  'jewellery-software',
  'pak-arq',
  'herboria',
  'pakistan-property',
  'best-estate-marketing',
  'international-consulting-services-ics',
  'noor-curtain-and-sofa-cloth'
)
order by slug;

-- HIGH CONFIDENCE — subcategory was already a real, correctly-spelled
-- child name; only the old pre-migration parent name needed fixing.
update businesses
set category = 'Real Estate & Construction'
where slug = 'faisal-hills'
  and category = 'Real Estate'
  and subcategory = 'Real Estate Agencies';

update businesses
set category = 'Travel & Hospitality'
where slug = 'hotel-the-oriel-islamabad'
  and category = 'Manufacturing'
  and subcategory = 'Hotels & Guest Houses';

-- HIGH CONFIDENCE — free-text subcategory maps cleanly onto one real child.
update businesses
set category = 'Home Services & Repair',
    subcategory = 'Electricians'
where slug = 'nz-electrician-services'
  and category = 'Electrical & Electronics'
  and subcategory = 'electrician';

update businesses
set category = 'Health & Medical',
    subcategory = 'Clinics & Doctors'
where slug = 'islamabad-pain-spine-stroke-center'
  and category = 'Healthcare & Medical'
  and subcategory = 'Clinic';

update businesses
set category = 'Real Estate & Construction',
    subcategory = 'Solar Installation'
where slug = 'orient-energy-system'
  and category = 'Electrical & Electronics'
  and subcategory = 'Energy';

update businesses
set category = 'Technology & Digital',
    subcategory = 'Digital Marketing & SEO Agencies'
where slug = 'seo-services-in-pakistan'
  and category = 'SEO'
  and subcategory is null;

update businesses
set category = 'Technology & Digital',
    subcategory = 'Digital Marketing & SEO Agencies'
where slug = 'boostrankify-affordable-professional-seo-agency'
  and category = 'IT & Software Services'
  and subcategory = 'marketing';

update businesses
set category = 'Technology & Digital',
    subcategory = 'IT Companies & Software Houses'
where slug = 'jewellery-software'
  and category = 'IT & Software Services'
  and subcategory = 'Jewellery Software';

update businesses
set category = 'Real Estate & Construction',
    subcategory = 'Real Estate Agencies'
where slug = 'pakistan-property'
  and category = 'Real Estate'
  and subcategory is null;

update businesses
set category = 'Professional Services',
    subcategory = 'Business Consultants'
where slug = 'international-consulting-services-ics'
  and category = 'Other'
  and subcategory = 'consulting service';

-- MEDIUM CONFIDENCE — same "don't force a wrong fit" rule as Cosmetics &
-- Personal Care: parent is a confident match, but no real child fits, so
-- subcategory is left NULL rather than guessed.
update businesses
set category = 'Health & Medical',
    subcategory = null
where slug = 'elijah-health-care'
  and category = 'Healthcare & Medical'
  and subcategory = 'Health Care Services';

update businesses
set category = 'Shopping & Retail',
    subcategory = 'Clothing & Boutiques'
where slug = 'wearing-parlour'
  and category = 'Fashion & Apparel'
  and subcategory is null;

-- MEDIUM CONFIDENCE — "estate" + old Real Estate category strongly implies
-- a property/agency business, but the name alone ("marketing") is not
-- fully conclusive. Review before running.
update businesses
set category = 'Real Estate & Construction',
    subcategory = 'Real Estate Agencies'
where slug = 'best-estate-marketing'
  and category = 'Real Estate'
  and subcategory is null;

-- LOW CONFIDENCE — no real child is a clean fit; parent-only per the
-- "don't force it" rule. Revisit if you know more about what these
-- businesses actually sell/do.
update businesses
set category = 'Technology & Digital',
    subcategory = null
where slug = 'pak-arq'
  and category = 'IT & Software Services'
  and subcategory is null;

update businesses
set category = 'Shopping & Retail',
    subcategory = null
where slug = 'herboria'
  and category = 'Retail & E-Commerce'
  and subcategory is null;

-- LOW CONFIDENCE — curtains/sofa cloth is soft furnishings retail with no
-- dedicated taxonomy child; "Furniture Stores" is the closest real one but
-- an imperfect fit (same open gap as furniture-interior-design in the
-- original migration diff — it genuinely splits into two categories).
update businesses
set category = 'Shopping & Retail',
    subcategory = 'Furniture Stores'
where slug = 'noor-curtain-and-sofa-cloth'
  and category = 'Furniture & Interior Design'
  and subcategory = 'Curtain and Sofa Cloth';

-- Verify: category/subcategory should now be real getParent()/getChild()
-- values from app/data/businessCategories.js for all 16.
select id, name, slug, category, subcategory
from businesses
where slug in (
  'faisal-hills',
  'hotel-the-oriel-islamabad',
  'nz-electrician-services',
  'islamabad-pain-spine-stroke-center',
  'orient-energy-system',
  'elijah-health-care',
  'wearing-parlour',
  'seo-services-in-pakistan',
  'boostrankify-affordable-professional-seo-agency',
  'jewellery-software',
  'pak-arq',
  'herboria',
  'pakistan-property',
  'best-estate-marketing',
  'international-consulting-services-ics',
  'noor-curtain-and-sofa-cloth'
)
order by slug;

commit;
