-- Follow-up to docs/seo/category-migration-diff.md, "Needs manual review"
-- section: VirtualVetDesk was promised this fix at the end of the previous
-- session ("Fix SQL was written and handed to the user... Not yet confirmed
-- run") but it was never actually captured in a runnable file, and a live
-- data check during this session's verification pass confirms the row is
-- still unfixed. This file closes that gap.
--
-- VirtualVetDesk is a veterinary consultation service that landed under
-- Pets & Animals with subcategory "Online Veterinary Consultations" — not a
-- real child of that parent (Pet Shops / Pet Grooming / Aquariums & Fish
-- Supplies). No child fits "veterinary consultations" specifically, so this
-- follows the same "don't force a wrong fit" rule already applied to
-- Cosmetics & Personal Care: set subcategory to NULL, parent-only.
--
-- Run the SELECT first to confirm this is still the 1 row expected, then
-- the UPDATE. Both wrapped in one transaction.

begin;

select id, name, slug, category, subcategory
from businesses
where slug = 'virtualvetdesk';

update businesses
set subcategory = null
where slug = 'virtualvetdesk'
  and category = 'Pets & Animals'
  and subcategory = 'Online Veterinary Consultations';

-- Verify: subcategory should now be null.
select id, name, slug, category, subcategory
from businesses
where slug = 'virtualvetdesk';

commit;
