-- Data-quality cleanup found while wiring up the indexing-threshold work
-- (see docs/seo/category-migration-diff.md, "Needs manual review" section
-- for the full writeup). Every WHERE clause pins both the slug AND the
-- current bad value, so this is safe to run even if something else edits
-- these rows before you get to it — a changed row just won't match and
-- won't be touched.
--
-- Run the SELECT block first to confirm these are still the 6 rows you
-- expect, then the UPDATE block. Both wrapped in one transaction.

begin;

-- Expect exactly 6 rows back, matching the "before" values commented next
-- to each UPDATE below.
select id, name, slug, category, subcategory
from businesses
where slug in (
  'let-s-rank-online',
  'evercare-plus-home-health-care-nursing-services-lahore',
  'allied-health-care-home-service-lahore-2',
  'allied-health-care-home-service',
  'allied-health-care-home-service-lahore',
  'ircc-pakistan-interventional-radiology-minimally-invasive-treatment-center'
)
order by slug;

-- 1. "Let's Rank Online" — category is still the pre-migration parent name
--    "IT & Software Services" (not a value the current submission form's
--    dropdown can even produce — see category-migration-diff.md's note on
--    how this one got in). next.config.js already redirects the old
--    /businesses/category/it-software-services URL to
--    /businesses/category/technology-digital at the PARENT level (no
--    specific child was ever chosen for this old category), so this
--    mirrors that same precedent rather than guessing a child.
--    NOTE: this listing's actual description text is about "NIPS Computer
--    Academy" (software/networking/data-science/AI training) — a content
--    mismatch with the business name that's worth you looking at
--    separately; not something SQL can fix.
update businesses
set category = 'Technology & Digital'
where slug = 'let-s-rank-online'
  and category = 'IT & Software Services';

-- 2-4. Three near-duplicate "home health care" businesses under Health &
--    Medical, each with a different free-text subcategory spelling that
--    doesn't match any real child (Hospitals, Clinics & Doctors, Dentists,
--    Pharmacies & Medical Stores, Diagnostic Labs, Physiotherapy Centers,
--    Eye Care & Optical, Homeopathic & Hakeem, Mental Health & Counseling,
--    Veterinary Clinics — none of them fit a home-visit nursing service).
--    Set to NULL (parent-only) rather than force a wrong fit, same rule
--    already applied to Cosmetics & Personal Care and VirtualVetDesk in
--    the original migration. Three independent businesses converging on
--    the same missing category is a real signal, worth considering as a
--    genuine new taxonomy child later (same reasoning as the "Watches"
--    addition) — that's a separate, code-side decision, not this file.
update businesses
set subcategory = null
where slug = 'evercare-plus-home-health-care-nursing-services-lahore'
  and subcategory = 'Home Health Care';

update businesses
set subcategory = null
where slug = 'allied-health-care-home-service-lahore-2'
  and subcategory = 'Health Care Home Service';

update businesses
set subcategory = null
where slug = 'allied-health-care-home-service'
  and subcategory = 'Health Home Service';

update businesses
set subcategory = null
where slug = 'allied-health-care-home-service-lahore'
  and subcategory = 'Health Home Care';

-- 5. IRCC Pakistan — subcategory was a long free-text list of specific
--    procedures (interventional radiology / minimally invasive
--    treatments), not a taxonomy value. "Clinics & Doctors" is the closest
--    real child (a specialized outpatient treatment center), but this is
--    a judgment call, not a confident match like #1 above — reword/adjust
--    if you know this business better.
update businesses
set subcategory = 'Clinics & Doctors'
where slug = 'ircc-pakistan-interventional-radiology-minimally-invasive-treatment-center'
  and subcategory like 'Uterine Fibroid Embolization%';

-- Verify: category/subcategory should now read as expected for all 6, and
-- every value below should be one that getParent()/getChild() in
-- app/data/businessCategories.js actually recognizes.
select id, name, slug, category, subcategory
from businesses
where slug in (
  'let-s-rank-online',
  'evercare-plus-home-health-care-nursing-services-lahore',
  'allied-health-care-home-service-lahore-2',
  'allied-health-care-home-service',
  'allied-health-care-home-service-lahore',
  'ircc-pakistan-interventional-radiology-minimally-invasive-treatment-center'
)
order by slug;

commit;
