## Project

Green Pages PK — Pakistan business directory + in-house digital marketing agency.
Next.js on Vercel. Production host: `https://www.greenpagespk.com` (with `www`).

## SEO rules — do not violate

- **Canonical host is `https://www.greenpagespk.com`.** Canonical tags, `sitemap.xml`
  entries, OG/Twitter URLs and internal absolute links must all emit this exact host,
  including `www`. Never emit `greenpages-pk.vercel.app`.
- **Indexing threshold.** Any category, subcategory, city, or city×category archive
  with fewer than `INDEXING_THRESHOLD` (3) published items must emit
  `<meta name="robots" content="noindex, follow">` and be excluded from `sitemap.xml`.
  At 3 or more it flips to `index, follow` and enters the sitemap.
  This is evaluated live from the database at render/build time — never a manual flag.
- `INDEXING_THRESHOLD` is defined once. Do not duplicate the number across files.
- Always `follow`, never `nofollow`, on archive pages — link equity must reach listings.
- Tag archives are always `noindex, follow`.
- Parent categories aggregate published counts from all their subcategories.
- Category links must be server-rendered `<a href>` in the initial HTML.
  Links that only appear after a JS filter interaction are invisible to crawlers.
- Category URLs are nested: `/businesses/category/[parent]/[sub]`. Never flat.
- Never hard-delete a category URL Google may have discovered. Deactivate and 301.
- Paid article placements (Featured / Sponsored) must have `rel="sponsored"` applied
  automatically from `submission_plan` in code — never left to admin discretion.

## Safety

- Never `git reset --hard`, never force-push, never delete files to simplify work.
- Never commit unrelated changes already in the working tree.
- Do not push to remote unless explicitly asked.
- Do not modify pricing, authentication, or payment code unless the task requires it.

## Active specs

- `docs/seo/category-implementation-prompt.md` — category taxonomy + indexing rule.
  Run this before the article submission work.
- `docs/seo/categories-seed.json` — source of truth for all categories and cities.
  Read it from disk in the seed script; do not retype or inline the taxonomy.
