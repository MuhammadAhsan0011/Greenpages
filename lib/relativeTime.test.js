import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRelativeTime } from "./relativeTime.js";

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

test("today reads as Today", () => {
  assert.equal(formatRelativeTime(new Date().toISOString()), "Today");
});

test("1 day ago is singular", () => {
  assert.equal(formatRelativeTime(daysAgo(1)), "1 day ago");
});

test("multiple days ago is plural", () => {
  assert.equal(formatRelativeTime(daysAgo(5)), "5 days ago");
});

test("about a month ago reads as 1 month ago", () => {
  assert.equal(formatRelativeTime(daysAgo(30)), "1 month ago");
});

test("several months ago is plural", () => {
  assert.equal(formatRelativeTime(daysAgo(90)), "3 months ago");
});

test("about a year ago reads as 1 year ago", () => {
  assert.equal(formatRelativeTime(daysAgo(365)), "1 year ago");
});

test("multiple years ago is plural", () => {
  assert.equal(formatRelativeTime(daysAgo(800)), "2 years ago");
});
