import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildJobCategoryTree,
  findJobCategoryInTree,
  getJobCategoryIdsUnderParent,
} from "./jobCategories.js";

const FLAT = [
  { id: "p2", slug: "design", parent_id: null, sort_order: 2 },
  { id: "p1", slug: "tech", parent_id: null, sort_order: 1 },
  { id: "c2", slug: "backend", parent_id: "p1", sort_order: 2 },
  { id: "c1", slug: "frontend", parent_id: "p1", sort_order: 1 },
  { id: "c3", slug: "branding", parent_id: "p2", sort_order: 1 },
];

test("buildJobCategoryTree sorts parents by sort_order", () => {
  const tree = buildJobCategoryTree(FLAT);
  assert.deepEqual(tree.map((p) => p.slug), ["tech", "design"]);
});

test("buildJobCategoryTree sorts each parent's children by sort_order", () => {
  const tree = buildJobCategoryTree(FLAT);
  const tech = tree.find((p) => p.slug === "tech");
  assert.deepEqual(tech.children.map((c) => c.slug), ["frontend", "backend"]);
});

test("findJobCategoryInTree finds a parent-level slug", () => {
  const tree = buildJobCategoryTree(FLAT);
  const { parent, child } = findJobCategoryInTree(tree, "design");
  assert.equal(parent.slug, "design");
  assert.equal(child, null);
});

test("findJobCategoryInTree finds a child-level slug and its parent", () => {
  const tree = buildJobCategoryTree(FLAT);
  const { parent, child } = findJobCategoryInTree(tree, "backend");
  assert.equal(parent.slug, "tech");
  assert.equal(child.slug, "backend");
});

test("findJobCategoryInTree returns nulls for an unknown slug", () => {
  const tree = buildJobCategoryTree(FLAT);
  const { parent, child } = findJobCategoryInTree(tree, "nope");
  assert.equal(parent, null);
  assert.equal(child, null);
});

test("getJobCategoryIdsUnderParent includes the parent's own id plus every child", () => {
  const tree = buildJobCategoryTree(FLAT);
  const tech = tree.find((p) => p.slug === "tech");
  assert.deepEqual(getJobCategoryIdsUnderParent(tech).sort(), ["c1", "c2", "p1"].sort());
});
