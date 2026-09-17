// Merges a taxonomy's static seed posts with its live (already-normalized,
// approved+published) Supabase articles for a given set of category names.
// Every blog archive page's render list AND its indexing-threshold count
// are `.length` of this same function's return value — never two separate
// computations that could silently disagree. Pure/dependency-free on
// purpose (no import of app/data/blog.js) so it stays trivially testable
// with the plain Node test runner and so app/data/blog.js — not this file —
// stays the one place that owns the actual post/article data.
export function getPublishedPostsForCategoryNames(names, staticPosts, normalizedArticles) {
  const nameSet = new Set(names);
  return [...staticPosts, ...normalizedArticles].filter((post) => nameSet.has(post.category));
}
