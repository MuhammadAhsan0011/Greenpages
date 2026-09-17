import { test } from "node:test";
import assert from "node:assert/strict";
import { createTaxonomyHelpers, getNamesUnderParent } from "./taxonomy.js";

// A small fixture tree, independent of the real 139/183-node taxonomies,
// so these tests don't need to change if the real data does.
const TREE = [
  {
    name: "Automotive",
    slug: "automotive",
    children: [
      { name: "Car Dealers", slug: "car-dealers" },
      { name: "Auto Workshops", slug: "auto-workshops" },
    ],
  },
  {
    name: "Food & Dining",
    slug: "food-dining",
    children: [{ name: "Restaurants", slug: "restaurants" }],
  },
];

const { getParent, getChild, resolveCategoryNodes } = createTaxonomyHelpers(TREE);

// These three functions are what app/account/actions.js and
// app/account/articles/actions.js now lean on to reject a bad
// category/subcategory on write — see the "close the write-path gap"
// fix. Covering them here pins the exact contract that validation relies
// on: getParent only matches parent-level slugs, getChild only matches a
// child that's actually under the given parent, resolveCategoryNodes
// finds a name at either level.

test("getParent matches only a real parent slug", () => {
  assert.equal(getParent("automotive")?.name, "Automotive");
  assert.equal(getParent("car-dealers"), undefined);
  assert.equal(getParent("not-a-real-slug"), undefined);
});

test("getChild requires the child to belong to the given parent", () => {
  assert.equal(getChild("automotive", "car-dealers")?.name, "Car Dealers");
  // A real child slug under the WRONG parent must not resolve — this is
  // exactly what stops "subcategory is a real child OF that parent, not
  // just any valid slug elsewhere in the tree" from being bypassed.
  assert.equal(getChild("food-dining", "car-dealers"), undefined);
  assert.equal(getChild("automotive", "not-a-real-child"), undefined);
});

test("resolveCategoryNodes finds a parent-level name", () => {
  const { parent, child } = resolveCategoryNodes("Automotive");
  assert.equal(parent?.name, "Automotive");
  assert.equal(child, null);
});

test("resolveCategoryNodes finds a child-level name and its parent", () => {
  const { parent, child } = resolveCategoryNodes("Car Dealers");
  assert.equal(parent?.name, "Automotive");
  assert.equal(child?.name, "Car Dealers");
});

test("resolveCategoryNodes returns nulls for a name that matches nothing", () => {
  const { parent, child } = resolveCategoryNodes("Not A Real Category");
  assert.equal(parent, null);
  assert.equal(child, null);
});

test("getNamesUnderParent includes the parent's own name plus every child", () => {
  const automotive = TREE[0];
  assert.deepEqual(getNamesUnderParent(automotive), ["Automotive", "Car Dealers", "Auto Workshops"]);
});
