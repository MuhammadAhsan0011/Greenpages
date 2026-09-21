// The rel attribute on a submitted article's declared external link
// (target_url/website_url) is computed from its submission_plan, never left
// to admin discretion — CLAUDE.md is explicit about this for Featured/
// Sponsored placements, and "no dofollow backlinks" applies to every tier.
export function getSubmissionLinkRel(submissionPlan) {
  return submissionPlan === "featured" || submissionPlan === "sponsored"
    ? "sponsored"
    : "nofollow";
}

export const ARTICLE_LINK_COUNT_LIMITS = {
  free: 1,
  featured: 2,
  sponsored: 3,
};

export function getArticleLinkLimit(submissionPlan) {
  return ARTICLE_LINK_COUNT_LIMITS[submissionPlan] ?? ARTICLE_LINK_COUNT_LIMITS.free;
}

// Counts <a href="..."> occurrences in already-sanitized article HTML — used
// both to store `link_count` for admin visibility and to enforce the
// backlink policy's per-plan cap server-side at submission time.
export function countContentLinks(html) {
  const matches = (html ?? "").match(/<a\s[^>]*href=/gi);
  return matches ? matches.length : 0;
}
