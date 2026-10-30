import { test } from "node:test";
import assert from "node:assert/strict";
import { getEntitledPlan, getPlanCapabilities, getPhotoLimit } from "./plans.js";

test("a Basic listing that asked for Verified may fill in Verified fields", () => {
  const plan = getEntitledPlan("free", "verified");
  assert.equal(plan, "verified");
  assert.equal(getPlanCapabilities(plan).socialLinks, true);
  assert.equal(getPhotoLimit(plan), 3);
});

test("a request never lowers a plan the listing already has", () => {
  assert.equal(getEntitledPlan("featured", "verified"), "featured");
  assert.equal(getEntitledPlan("verified", "verified"), "verified");
});

test("no request, or a junk one, leaves the real plan in charge", () => {
  assert.equal(getEntitledPlan("free", null), "free");
  assert.equal(getEntitledPlan("free", "free"), "free");
  assert.equal(getEntitledPlan("free", "enterprise"), "free");
  assert.equal(getEntitledPlan(undefined, "featured"), "featured");
});

test("the public page's gate (real plan only) still locks a requested-only listing", () => {
  // The listing page calls getPlanCapabilities(business.plan), never the
  // entitled plan, so a pending request keeps the data hidden.
  assert.equal(getPlanCapabilities("free").socialLinks, false);
  assert.equal(getPlanCapabilities("free").aboutEditor, false);
  assert.equal(getPhotoLimit("free"), 1);
});
