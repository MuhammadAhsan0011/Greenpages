import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPublishedJob,
  isAcceptingApplications,
  matchesCategoryIds,
  matchesCity,
  matchesCityCategory,
  filterForCategory,
  filterForCity,
  filterForCityCategory,
} from "./jobListings.js";

function makeJob(overrides = {}) {
  return {
    id: "job-1",
    status: "published",
    category_id: "cat-1",
    city: "Karachi",
    expires_at: null,
    application_deadline: null,
    ...overrides,
  };
}

test("a published job with no expiry/deadline is published", () => {
  assert.equal(isPublishedJob(makeJob()), true);
});

test("a pending_review job is not published", () => {
  assert.equal(isPublishedJob(makeJob({ status: "pending_review" })), false);
});

// isPublishedJob only checks status now — a job stays visible (listings,
// detail page, sitemap) after its deadline passes; it just stops
// accepting applications (see isAcceptingApplications below). Real job
// boards keep expired postings live with an "Expired" label rather than
// making the page disappear.
test("a job past its expires_at is still published (just not accepting applications)", () => {
  assert.equal(
    isPublishedJob(makeJob({ expires_at: new Date(Date.now() - 1000).toISOString() })),
    true
  );
});

test("a job past its application_deadline is still published (just not accepting applications)", () => {
  assert.equal(isPublishedJob(makeJob({ application_deadline: "2020-01-01" })), true);
});

test("isAcceptingApplications: a published job with no expiry/deadline is accepting", () => {
  assert.equal(isAcceptingApplications(makeJob()), true);
});

test("isAcceptingApplications: a pending_review job is not accepting", () => {
  assert.equal(isAcceptingApplications(makeJob({ status: "pending_review" })), false);
});

test("isAcceptingApplications: a job past its expires_at is not accepting", () => {
  assert.equal(
    isAcceptingApplications(makeJob({ expires_at: new Date(Date.now() - 1000).toISOString() })),
    false
  );
});

test("isAcceptingApplications: a job with a future expires_at is still accepting", () => {
  assert.equal(
    isAcceptingApplications(makeJob({ expires_at: new Date(Date.now() + 100000).toISOString() })),
    true
  );
});

test("isAcceptingApplications: a job past its application_deadline is not accepting", () => {
  assert.equal(isAcceptingApplications(makeJob({ application_deadline: "2020-01-01" })), false);
});

test("matchesCategoryIds checks membership in the given id set", () => {
  const job = makeJob({ category_id: "cat-2" });
  assert.equal(matchesCategoryIds(job, ["cat-1", "cat-2"]), true);
  assert.equal(matchesCategoryIds(job, ["cat-1"]), false);
});

test("matchesCity matches case-insensitively and by substring", () => {
  const job = makeJob({ city: "Karachi, Sindh" });
  assert.equal(matchesCity(job, "karachi"), true);
  assert.equal(matchesCity(job, "Lahore"), false);
});

test("matchesCityCategory requires both city and category to match", () => {
  const job = makeJob({ city: "Karachi", category_id: "cat-1" });
  assert.equal(matchesCityCategory(job, "Karachi", ["cat-1"]), true);
  assert.equal(matchesCityCategory(job, "Karachi", ["cat-2"]), false);
  assert.equal(matchesCityCategory(job, "Lahore", ["cat-1"]), false);
});

test("filterForCategory excludes unpublished and non-matching jobs", () => {
  const jobs = [
    makeJob({ id: "a", category_id: "cat-1" }),
    makeJob({ id: "b", category_id: "cat-2" }),
    makeJob({ id: "c", category_id: "cat-1", status: "pending_review" }),
  ];
  const result = filterForCategory(jobs, ["cat-1"]);
  assert.deepEqual(result.map((j) => j.id), ["a"]);
});

test("filterForCity excludes unpublished and non-matching jobs", () => {
  const jobs = [
    makeJob({ id: "a", city: "Karachi" }),
    makeJob({ id: "b", city: "Lahore" }),
    makeJob({ id: "c", city: "Karachi", status: "closed" }),
  ];
  const result = filterForCity(jobs, "Karachi");
  assert.deepEqual(result.map((j) => j.id), ["a"]);
});

test("filterForCityCategory requires all three conditions", () => {
  const jobs = [
    makeJob({ id: "a", city: "Karachi", category_id: "cat-1" }),
    makeJob({ id: "b", city: "Karachi", category_id: "cat-2" }),
    makeJob({ id: "c", city: "Lahore", category_id: "cat-1" }),
  ];
  const result = filterForCityCategory(jobs, "Karachi", ["cat-1"]);
  assert.deepEqual(result.map((j) => j.id), ["a"]);
});
