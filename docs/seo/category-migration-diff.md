# Category taxonomy migration — old slug diff

Originally generated during the category-taxonomy planning pass (Task 2), as
an input to a decision rather than a record of one. That decision has since
been made: all 7 ambiguous slugs were resolved, the redirect map is live in
`next.config.js`, and `businessCategories.js`/`blog.js` have been rewritten
into the two-level structure this diff describes. This file is kept as the
historical record of *why* each mapping was chosen.

Business counts are live, queried directly from Supabase on the day this was
originally written (41 businesses, 6 approved articles + the static blog
posts).

## Final state (end of this migration session)

- **`businessCategories.js`:** 20 parents / 139 children (138 original +
  `watches`, see below).
- **`blog.js`:** 20 parents / 183 children.
- **Data:** the DB-side migration described below
  (`other-bucket-migration.sql`, `article-category-migration.sql`,
  `business-category-normalization.sql`) has been run. All 41 businesses
  and 6 approved articles hold valid new-taxonomy category/subcategory
  values directly — the only exception is `ganzay`, deliberately left
  uncategorized (`needs_review = true`, see below).
- **The legacy bridge existed and was removed.** `app/data/
  legacyCategoryNames.js` was a temporary old-name → new-name translation
  layer (every category-page query had to check both the new taxonomy name
  and whatever old flat name used to mean the same thing). Once the DB rows
  above were normalized, it became pure dead weight — two code paths for
  reading the same category — so it was deleted, and every consumer now
  matches taxonomy names directly with no translation layer.

If you're reading this file to understand *why* a mapping was chosen, it's
still accurate — just note the bridge it originally justified no longer
exists.

---

## Directory categories (`businessCategories.js`, 33 old slugs)

### List A — exact match, no action needed

| old slug | name | business count |
|---|---|---|
| agriculture-livestock | Agriculture & Livestock | 0 |
| arts-crafts | Arts & Crafts | 0 |
| automotive | Automotive | 2 |
| education-training | Education & Training | 2 |
| professional-services | Professional Services | 2 |

All 4 of the GSC-critical slugs except `beauty-salons` land here — they exist
verbatim as parent slugs in the new taxonomy, so no redirect is required for
them.

### List B — renamed, merged, or level-changed — needs a 301 (28 rows)

| old slug | name | count | proposed new target | confidence | note |
|---|---|---|---|---|---|
| healthcare-medical | Healthcare & Medical | 7 | `health-medical` | high | name tightened, MUST redirect |
| financial-insurance-services | Financial & Insurance Services | 4 | `financial-services` | high | MUST redirect |
| seo | SEO | 4 | `technology-digital/digital-marketing-agencies` | medium | no direct "seo" bucket in directory taxonomy; MUST redirect |
| it-software-services | IT & Software Services | 3 | `technology-digital` | medium | parent-level only; could instead land on `software-houses` child — MUST redirect |
| freight-shipping-logistics | Freight, Shipping & Logistics | 2 | `transport-logistics` | high | MUST redirect |
| hospitality-tourism | Hospitality & Tourism | 2 | `travel-hospitality` | high | MUST redirect |
| beauty-salons | Beauty & Salons | 0 | `beauty-wellness/beauty-salons` | high | **GSC-critical — MUST redirect** even though count is 0 and the slug text itself is unchanged, because it moves from a flat to a nested URL |
| web-development | Web Development | 1 | `technology-digital/web-development` | high | flat → nested, slug text unchanged |
| solar-renewable-energy | Solar & Renewable Energy | 1 | `real-estate-construction/solar-installation` | high | |
| textiles-garments | Textiles & Garments | 1 | `industrial-manufacturing/textile-manufacturers` | high | |
| food-beverage | Food & Beverage | 1 | `food-dining` | high | |
| cosmetics-personal-care | Cosmetics & Personal Care | 1 | `beauty-wellness` | medium | parent-level only, no obviously-correct child |
| legal-services | Legal Services | 1 | `professional-services/lawyers-legal` | medium | the one business using this slug (Ninja Aviation) is actually miscategorized — see Task 3 notes, category-diff target is still valid for the slug itself |
| real-estate | Real Estate | 1 | `real-estate-construction` | high | merges with `construction-real-estate` below |
| content-marketing | Content Marketing | 1 | `technology-digital/digital-marketing-agencies` | low | no real fit exists in the directory taxonomy — flagged, needs your call |
| manufacturing | Manufacturing | 0 | `industrial-manufacturing` | high | |
| construction-real-estate | Construction & Real Estate | 0 | `real-estate-construction` | high | merges with `real-estate` above |
| industrial-machinery | Industrial Machinery | 0 | `industrial-manufacturing/machinery-tools` | medium | |
| packaging-printing | Packaging & Printing | 0 | `industrial-manufacturing/printing-press` | low | alternative: `media-advertising/printing-signage` — needs your call |
| chemicals-rubber-plastics | Chemicals, Rubber & Plastics | 0 | `industrial-manufacturing/chemicals-industrial` | low | alternative: `plastic-packaging` — needs your call |
| electrical-electronics | Electrical & Electronics | 0 | `shopping-retail/electronics-appliances` | low | alternative: `home-services/electricians` (retail vs. trade) — needs your call |
| furniture-interior-design | Furniture & Interior Design | 0 | `shopping-retail/furniture-stores` | low | genuinely splits into two unrelated new categories (`furniture-stores` retail vs. `professional-services/interior-designers` service) — can only 301 to one, needs your call |
| events-entertainment | Events & Entertainment | 0 | `events-weddings` | medium | "entertainment" half has no real home in the new taxonomy |
| sports-fitness | Sports & Fitness | 0 | `beauty-wellness/gyms-fitness` | low | imperfect — new taxonomy has no dedicated sports-venue category |
| retail-e-commerce | Retail & E-Commerce | 0 | `shopping-retail` | high | "e-commerce" concept dropped in new taxonomy |
| fashion-apparel | Fashion & Apparel | 0 | `shopping-retail/clothing-boutiques` | high | |
| security-surveillance | Security & Surveillance | 0 | `technology-digital/cctv-security` | high | |
| **other** | **Other** | **5** | **none exists** | — | no target in the new taxonomy at all; 5 real businesses need either a per-row reassignment (see Task 3 report) or a decision to keep a permanent non-taxonomy catch-all page. MUST resolve — this is the biggest open decision in the whole migration. |

### List C — new, just add (no old data maps here)

**Parent level:** 18 of the 20 new parents receive at least one proposed
redirect target from the table above (even if only from a low-confidence
guess). Only **2 parents have zero relationship to any old slug** and are
entirely new additions: `community-nonprofit`, `pets-animals`.

**Child level:** 138 total children across all 20 parents. Only **13
children** are anyone's proposed redirect target (`digital-marketing-agencies`,
`web-development`, `cctv-security`, `textile-manufacturers`, `machinery-tools`,
`solar-installation`, `lawyers-legal`, `printing-press`, `chemicals-industrial`,
`electronics-appliances`, `clothing-boutiques`, `gyms-fitness`,
`furniture-stores`). The remaining **125 children (91%)** have no historical
data or redirect need whatsoever — they are exactly as given in your taxonomy
spec, with no changes.

---

## Blog categories (`blog.js`, 9 old slugs)

### List A — exact match, no action needed

| old slug | name | count (static + approved articles) |
|---|---|---|
| business | Business | 1 |
| technology | Technology | 0 |

### List B — renamed / level-changed — needs a 301 (6 rows)

| old slug | count | proposed new target | confidence | note |
|---|---|---|---|---|
| seo | 2 | `digital-marketing/seo` | high | flat → nested, slug text unchanged, MUST redirect |
| web-development | 1 | `digital-marketing/web-development` | high | MUST redirect |
| content-marketing | 1 (static post only) | `digital-marketing/content-marketing` | high | MUST redirect |
| services | 1 | `/blog` | high | per your explicit instruction — retire, reassign the one post, redirect the archive to `/blog` |
| online | 1 | `business` (e-commerce reading) | low | alternative: `technology` (internet reading) — needs your call, MUST redirect since nonzero |
| accounting | 0 | `finance` | low | no "Accounting" child exists in the new blog taxonomy, closest is `finance`'s "Taxation" child — needs your call |

### List C — new, just add

**Parent level:** 16 of the 20 new blog parents are entirely untouched by any
old slug: `real-estate`, `health-fitness`, `self-improvement`, `relationships`,
`home-family`, `travel`, `food-cooking`, `sports`, `writing`,
`lifestyle-fashion`, `pets-animals`, `news-society`, `automotive-blog`,
`entertainment`, `career`, `education`. `finance` and `digital-marketing` are
touched only via a low-confidence guess (`accounting`) or the seo/web-dev/
content-marketing children.

**Child level:** 183 total children. Only **3** (`seo`, `web-development`,
`content-marketing`, all under `digital-marketing`) are redirect targets. The
remaining **180 children (98%)** are brand new.

---

## Decisions made on the 7 ambiguous slugs

All resolved. `other` is retired outright (301 to `/businesses`, no
taxonomy home) rather than kept as a catch-all — its 5 businesses are
reassigned individually (see below), not auto-mapped. `packaging-printing`
→ `industrial-manufacturing/plastic-packaging`. `chemicals-rubber-plastics`
→ `industrial-manufacturing/chemicals-industrial`. `electrical-electronics`
→ `shopping-retail/electronics-appliances`. `furniture-interior-design` →
`shopping-retail/furniture-stores`. `sports-fitness` →
`beauty-wellness/gyms-fitness`. `content-marketing` (directory) →
`technology-digital/digital-marketing-agencies`. `online` (blog) → read the
one post in it (an Akhuwat loan application guide) and, since it fit
neither of the two options it was scoped to, reassigned to
`finance/loans-and-credit` instead. `accounting` (blog) →
`blog/category/finance`.

## Taxonomy addition: "Watches"

`Timezone watches` (one of the 5 "Other" businesses) didn't fit any
existing child under `shopping-retail` — closest was `jewellery`, but a
watch store isn't really a jewellery shop. Rather than force a wrong fit,
a new child was added: **Watches = `watches`**, under `shopping-retail`,
positioned right after `jewellery` (sortOrder 4, shifting `mobile-shops`
and everything after it down by one). The taxonomy is allowed to flex when
a real listing doesn't fit — that's the standing rule going forward, not
just for this one case.

## Taxonomy gap: "Cosmetics & Personal Care"

`Exprescents` (old category "Cosmetics & Personal Care") was normalized to
the **`beauty-wellness` parent only** — none of that parent's children
(Beauty Salons, Barbers & Men's Salons, Bridal Makeup Artists, Spa &
Massage, Skin & Laser Clinics, Gyms & Fitness Centers, Yoga & Pilates
Studios) is a real fit for a cosmetics/personal-care-products retailer;
they're all service venues, not a retail category. Sitting at parent level
is intentional, not an oversight — same "don't force a wrong fit" principle
as the Watches addition below, just resolved by leaving `subcategory` empty
instead of adding a new child. Revisit if more cosmetics-retail businesses
sign up and a dedicated child becomes worth adding.

## Needs manual review

**Ganzay** (one of the 5 "Other" businesses) — description reads "Ganzay
LLC is a global travel and experiences company... worldwide," with no
Pakistan mention, and its stored city is "Claymont" (Delaware, US), not any
real Pakistani city. A US-based "global travel company" with no visible
Pakistan presence dilutes the topical relevance of a Pakistan business
directory. Rather than categorize it (my best guess would have been
`travel-hospitality/travel-agencies`), it's flagged `needs_review = true`
(new `businesses` column, see `supabase/schema.sql`) and excluded from the
main directory, city pages, category pages, and the sitemap until someone
manually verifies it's a genuine PK-serving business and clears the flag.
Its own `/businesses/ganzay` page still resolves if someone has the direct
link — only listing surfaces exclude it. **Still open** — nobody has
verified/cleared this yet as of the end of this session.

**VirtualVetDesk** and **Ninja Aviation** — both were renamed onto their
old category's approved new slug during normalization, but flagged as
probably still wrong: VirtualVetDesk is a veterinary consultation service
that landed in Travel & Hospitality (because its old category was
"Hospitality & Tourism"), and Ninja Aviation is an Umrah travel agency
that landed in Professional Services / Lawyers & Legal Services (because
its old category was "Legal Services"). Fix SQL was written and handed to
the user at the end of this session:
- `virtualvetdesk` → `Pets & Animals` (parent only — no child fits
  "veterinary consultations" specifically, same gap as Cosmetics & Personal
  Care above)
- `ninja-aviation-umrah-agency-in-lahore` → `Travel & Hospitality` /
  `Hajj & Umrah Services`

**Not yet confirmed run** as of the end of this session — verify these two
rows before relying on their category being correct.

## The 5 "Other" businesses — final disposition

| business | disposition |
|---|---|
| umrahmurshadpk | → `travel-hospitality/hajj-umrah-services` |
| Khatri Enterprises | → `home-services/pest-control` |
| tinytinkers | → `shopping-retail/toys-kids` |
| Timezone watches | → `shopping-retail/watches` (new child, see above) |
| Ganzay | **not categorized** — flagged `needs_review`, see above |

Applied via `other-bucket-migration.sql` (handed to the user to run in the
Supabase SQL Editor — RLS blocks anonymous writes, so this session can't
run it directly).
