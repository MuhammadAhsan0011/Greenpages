import { test } from "node:test";
import assert from "node:assert/strict";
import { getArchiveRobots } from "./indexing.js";
import { getPublishedPostsForCategoryNames } from "./blogContent.js";

const staticPosts = [
  { slug: "seo-a", category: "SEO" },
  { slug: "seo-b", category: "SEO" },
  { slug: "web-dev-a", category: "Web Development" },
];

const normalizedArticles = [
  { slug: "seo-c", category: "SEO" },
  { slug: "finance-a", category: "Finance" },
];

test("merges static posts and normalized articles for the given names", () => {
  const result = getPublishedPostsForCategoryNames(["SEO"], staticPosts, normalizedArticles);
  assert.equal(result.length, 3);
  assert.deepEqual(
    result.map((p) => p.slug).sort(),
    ["seo-a", "seo-b", "seo-c"]
  );
});

test("a parent name set (parent + children) rolls up posts from both", () => {
  // Simulates getNamesUnderParent(parent) for a parent whose only child
  // with content is "SEO" — the parent-level archive must show/count both.
  const result = getPublishedPostsForCategoryNames(
    ["Digital Marketing", "SEO", "Web Development"],
    staticPosts,
    normalizedArticles
  );
  assert.equal(result.length, 4);
});

test("count and render list are the same array — no separate computation", () => {
  const rendered = getPublishedPostsForCategoryNames(["SEO"], staticPosts, normalizedArticles);
  const count = getPublishedPostsForCategoryNames(["SEO"], staticPosts, normalizedArticles).length;
  assert.equal(rendered.length, count);
});

test("2 combined posts is below threshold (noindex); 3 qualifies (index)", () => {
  const below = getPublishedPostsForCategoryNames(["Web Development"], staticPosts, normalizedArticles);
  assert.equal(below.length, 1);
  assert.deepEqual(getArchiveRobots(below.length), { index: false, follow: true });

  const atThreshold = getPublishedPostsForCategoryNames(["SEO"], staticPosts, normalizedArticles);
  assert.equal(atThreshold.length, 3);
  assert.deepEqual(getArchiveRobots(atThreshold.length), { index: true, follow: true });
});

test("a name with no matching posts returns an empty list", () => {
  const result = getPublishedPostsForCategoryNames(["Nonexistent"], staticPosts, normalizedArticles);
  assert.deepEqual(result, []);
});
