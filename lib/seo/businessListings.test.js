import { test } from "node:test";
import assert from "node:assert/strict";
import { getArchiveRobots } from "./indexing.js";
import {
  isPublishedBusiness,
  filterForParent,
  filterForChild,
  filterForCity,
  filterForCityParent,
} from "./businessListings.js";

function business(overrides) {
  return {
    needs_review: false,
    category: "Automotive",
    subcategory: null,
    city: "Karachi",
    ...overrides,
  };
}

test("isPublishedBusiness excludes needs_review rows", () => {
  assert.equal(isPublishedBusiness(business({ needs_review: true })), false);
  assert.equal(isPublishedBusiness(business({ needs_review: false })), true);
});

test("a parent with 1 listing in each of 3 children has a count of 3 and qualifies", () => {
  const rows = [
    business({ subcategory: "Car Dealers" }),
    business({ subcategory: "Auto Workshops & Repair" }),
    business({ subcategory: "Auto Spare Parts" }),
  ];
  const parentListings = filterForParent(rows, "Automotive");
  assert.equal(parentListings.length, 3);
  assert.deepEqual(getArchiveRobots(parentListings.length), { index: true, follow: true });
});

test("a child category below threshold is excluded and noindex", () => {
  const rows = [
    business({ subcategory: "Car Dealers" }),
    business({ subcategory: "Car Dealers" }),
    business({ subcategory: "Auto Workshops & Repair" }),
  ];
  const childListings = filterForChild(rows, "Automotive", "Car Dealers");
  assert.equal(childListings.length, 2);
  assert.deepEqual(getArchiveRobots(childListings.length), { index: false, follow: true });
});

test("filterForParent never includes another parent's rows", () => {
  const rows = [business({ category: "Automotive" }), business({ category: "Food & Dining" })];
  assert.equal(filterForParent(rows, "Automotive").length, 1);
});

test("needs_review rows never count toward any threshold", () => {
  const rows = [
    business({ subcategory: "Car Dealers" }),
    business({ subcategory: "Car Dealers" }),
    business({ subcategory: "Car Dealers", needs_review: true }),
  ];
  assert.equal(filterForChild(rows, "Automotive", "Car Dealers").length, 2);
});

test("filterForCity matches case-insensitively and by substring", () => {
  const rows = [business({ city: "Karachi, Sindh" }), business({ city: "Lahore" })];
  assert.equal(filterForCity(rows, "karachi").length, 1);
});

test("filterForCityParent requires both city and parent to match", () => {
  const rows = [
    business({ city: "Karachi", category: "Automotive" }),
    business({ city: "Karachi", category: "Food & Dining" }),
    business({ city: "Lahore", category: "Automotive" }),
  ];
  assert.equal(filterForCityParent(rows, "Karachi", "Automotive").length, 1);
});
