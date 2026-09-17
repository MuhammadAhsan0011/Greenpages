import { test } from "node:test";
import assert from "node:assert/strict";
import { INDEXING_THRESHOLD, getArchiveRobots, TAG_ARCHIVE_ROBOTS } from "./indexing.js";

test("INDEXING_THRESHOLD is 3", () => {
  assert.equal(INDEXING_THRESHOLD, 3);
});

test("below threshold (count 2) is noindex, follow", () => {
  assert.deepEqual(getArchiveRobots(2), { index: false, follow: true });
});

test("at threshold (count 3) is index, follow", () => {
  assert.deepEqual(getArchiveRobots(3), { index: true, follow: true });
});

test("above threshold (count 10) is index, follow", () => {
  assert.deepEqual(getArchiveRobots(10), { index: true, follow: true });
});

test("zero is noindex, follow — never nofollow", () => {
  assert.deepEqual(getArchiveRobots(0), { index: false, follow: true });
});

test("tag archives are always noindex, follow", () => {
  assert.deepEqual(TAG_ARCHIVE_ROBOTS, { index: false, follow: true });
});
