## Project

Green Pages PK — Pakistan business directory + in-house digital marketing agency.
Next.js on Vercel. Production host: `https://www.greenpagespk.com` (with `www`).
This project is worked on from more than one device/session — rules in this
file apply to every Claude Code session in this repo, not just the one
currently open.

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
- Do not modify pricing, authentication, or payment code unless the task requires it.

## Deployment — never deploy without explicit, same-conversation permission

- **CORRECTION (2026-09-20, verified directly): this project's Vercel
  project IS connected via GitHub integration and DOES auto-deploy to
  production on every push to `main`.** Confirmed by pushing commit
  `40a34e8`: within ~2 minutes, a new "Ready" production deployment appeared
  and `vercel alias ls` showed it already aliased to
  `www.greenpagespk.com` — with no `vercel --prod` ever run for it (that
  manual call separately failed with "Not authorized" and is unrelated).
  So the assumption below this line — that pushing and deploying are
  cleanly separable — does **not** hold operationally for this repo:
  **`git push origin main` puts the change on production regardless of
  whether `vercel --prod` is ever run.** Treat "just push, don't deploy" as
  currently impossible to honor literally; if the user asks for that,
  tell them push-to-main auto-deploys here and confirm they still want to
  push before doing so, rather than silently pushing under a false
  assurance that production is unaffected.
- **Never run `npx vercel --prod` (or any other manual production deploy)
  unless the user explicitly asks for it in that conversation** — e.g.
  "deploy kardo", "deploy this", "push it live", "haan deploy kardo" in
  answer to a direct question. This still governs the manual CLI command;
  it just doesn't add the safety margin it implies once you know push
  already deploys.
- If the user says "just push to git, don't deploy" (or anything similar in
  Urdu/English): per the correction above, a push to `main` will deploy
  regardless — say so and get their explicit confirmation before pushing,
  rather than pushing and assuming production is untouched.
- If it's unclear whether "push" means git-push-only or push-and-deploy, ask
  before pushing to `main` at all (not just before running `vercel --prod`).
- A standing "don't deploy right now" from the user is durable — it holds
  until the user explicitly says to deploy, even across separate
  conversations/sessions/devices working in this same repo. Conversely, "do
  not push to remote unless explicitly asked" is the default for git pushes
  too — explicit permission in the current conversation covers push and/or
  deploy, whichever was actually asked for.
- Before deploying, it's worth checking `git log -1` / `vercel ls` to see
  whether another session already deployed the pending commits, so you don't
  duplicate work — but that check is not a substitute for the user's
  explicit go-ahead in *this* conversation.
- Commit + push: `git add -A && git commit -m "..." && git push`.
- Deploy (only when explicitly asked): `npx vercel --prod` from the repo root.

## Active specs

- `docs/seo/category-implementation-prompt.md` — category taxonomy + indexing rule.
  Run this before the article submission work.
- `docs/seo/categories-seed.json` — source of truth for all categories and cities.
  Read it from disk in the seed script; do not retype or inline the taxonomy.
