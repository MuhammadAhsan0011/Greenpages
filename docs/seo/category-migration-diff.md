# Category taxonomy migration — old slug diff

Generated during the category-taxonomy planning pass (Task 2). Nothing in this
file has been applied — `businessCategories.js`, `blog.js`, and
`next.config.js` are all untouched. This is the input to that decision, not a
record of a change already made.

Business counts are live, queried directly from Supabase on the day this was
written (41 businesses, 6 approved articles + the static blog posts).

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

## Open decisions blocking a finalized redirect map

1. `other` (5 real businesses, no target exists) — reassign per-row or keep a
   permanent catch-all page?
2. `packaging-printing`, `chemicals-rubber-plastics`, `electrical-electronics`,
   `furniture-interior-design`, `sports-fitness`, `content-marketing`
   (directory) — pick between the alternatives listed, or provide a different
   target.
3. `online`, `accounting` (blog) — pick between the alternatives listed.

Everything else in List B is proposed at "high" or "medium" confidence and
will be applied as written unless you override it.
