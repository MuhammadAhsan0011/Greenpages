import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getSubmissionLinkRel,
  getArticleLinkLimit,
  countContentLinks,
} from "./articleLinks.js";

test("free plan's declared link is nofollow", () => {
  assert.equal(getSubmissionLinkRel("free"), "nofollow");
});

test("featured plan's declared link is sponsored", () => {
  assert.equal(getSubmissionLinkRel("featured"), "sponsored");
});

test("sponsored plan's declared link is sponsored", () => {
  assert.equal(getSubmissionLinkRel("sponsored"), "sponsored");
});

test("an unrecognized plan defaults to the free tier's limit", () => {
  assert.equal(getArticleLinkLimit("bogus"), 1);
});

test("link limits are 1/2/3 for free/featured/sponsored", () => {
  assert.equal(getArticleLinkLimit("free"), 1);
  assert.equal(getArticleLinkLimit("featured"), 2);
  assert.equal(getArticleLinkLimit("sponsored"), 3);
});

test("countContentLinks counts every <a href> in the HTML", () => {
  const html = '<p>See <a href="https://a.com">A</a> and <a href="https://b.com">B</a>.</p>';
  assert.equal(countContentLinks(html), 2);
});

test("countContentLinks returns 0 for content with no links", () => {
  assert.equal(countContentLinks("<p>No links here.</p>"), 0);
});

test("countContentLinks returns 0 for empty/null content", () => {
  assert.equal(countContentLinks(""), 0);
  assert.equal(countContentLinks(null), 0);
});
