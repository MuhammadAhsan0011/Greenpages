import { test } from "node:test";
import assert from "node:assert/strict";
import { trimBusinessToPlan, imageUrlsInHtml } from "./businessPlanTrim.js";

const full = {
  photos: "https://s/p1.jpg, https://s/p2.jpg, https://s/p3.jpg",
  cover_image_url: "https://s/cover.jpg",
  facebook_url: "https://facebook.com/x",
  instagram_url: null,
  linkedin_url: "https://linkedin.com/x",
  whatsapp_url: "https://wa.me/92300",
  about_html: '<p>Hi</p><img src="https://s/inline.png" alt="">',
};

test("a Basic listing keeps one photo and loses every Verified-only field", () => {
  const { update, removedFiles } = trimBusinessToPlan(full, "free");
  assert.equal(update.photos, "https://s/p1.jpg");
  assert.equal(update.cover_image_url, null);
  assert.equal(update.facebook_url, null);
  assert.equal(update.linkedin_url, null);
  assert.equal(update.whatsapp_url, null);
  assert.equal(update.about_html, null);
  assert.equal("instagram_url" in update, false, "already-empty columns need no update");
  assert.deepEqual(removedFiles.sort(), [
    "https://s/cover.jpg",
    "https://s/inline.png",
    "https://s/p2.jpg",
    "https://s/p3.jpg",
  ]);
});

test("a Verified listing keeps its Verified data", () => {
  const { update, removedFiles } = trimBusinessToPlan(full, "verified");
  assert.deepEqual(update, {});
  assert.deepEqual(removedFiles, []);
});

test("a Verified listing is still capped at its photo limit", () => {
  const many = { ...full, photos: "a, b, c, d, e" };
  const { update, removedFiles } = trimBusinessToPlan(many, "verified");
  assert.equal(update.photos, "a, b, c");
  assert.deepEqual(removedFiles, ["d", "e"]);
});

test("a listing with nothing extra needs no changes", () => {
  const { update, removedFiles } = trimBusinessToPlan({ photos: "only.jpg" }, "free");
  assert.deepEqual(update, {});
  assert.deepEqual(removedFiles, []);
});

test("imageUrlsInHtml finds img sources", () => {
  assert.deepEqual(imageUrlsInHtml("<img src='a.png'><p>x</p><IMG alt='' src=\"b.png\">"), ["a.png", "b.png"]);
  assert.deepEqual(imageUrlsInHtml(null), []);
});
