import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectAds,
  selectTickerAds,
  tickerLayout,
  isAdEligible,
  adLifecycle,
  isSafeTargetUrl,
  isLikelyBot,
  deviceBucket,
  ctr,
  splitHtmlAfterParagraph,
  todayInKarachi,
} from "./ads.js";

const ad = (id, width, extra = {}) => ({ id, width, height: 90, priority: 5, order: 0, responsive: false, ...extra });
const slot = (ads, extra = {}) => ({ rotation: "off", max: 1, desktop: true, tablet: true, mobile: true, ads, ...extra });

test("an ad that is too wide for the space is not shown", () => {
  const s = slot([ad("lb", 728)]);
  assert.deepEqual(selectAds(s, { device: "mobile", availableWidth: 360 }), []);
  assert.equal(selectAds(s, { device: "desktop", availableWidth: 1100 })[0].id, "lb");
});

test("desktop gets the wide banner and mobile the narrow one from the same placement", () => {
  const s = slot([ad("lb", 728), ad("mob", 320)]);
  assert.equal(selectAds(s, { device: "desktop", availableWidth: 1100 })[0].id, "lb");
  assert.equal(selectAds(s, { device: "mobile", availableWidth: 360 })[0].id, "mob");
});

test("a responsive ad always fits", () => {
  const s = slot([ad("r", 970, { responsive: true })]);
  assert.equal(selectAds(s, { device: "mobile", availableWidth: 300 }).length, 1);
});

test("a placement switched off for a device shows nothing there", () => {
  const s = slot([ad("a", 300)], { mobile: false });
  assert.deepEqual(selectAds(s, { device: "mobile", availableWidth: 400 }), []);
  assert.equal(selectAds(s, { device: "tablet", availableWidth: 400 }).length, 1);
  assert.deepEqual(selectAds(null, { device: "desktop", availableWidth: 400 }), []);
});

test("no rotation: highest priority wins, ties go to the older ad", () => {
  const s = slot([ad("low", 300, { priority: 2 }), ad("hi", 300, { priority: 9, order: 2 }), ad("hi-old", 300, { priority: 9, order: 1 })]);
  assert.equal(selectAds(s, { device: "desktop", availableWidth: 400 })[0].id, "hi-old");
});

test("rotation avoids repeating the ad shown last time when there is a choice", () => {
  const s = slot([ad("a", 300), ad("b", 300)], { rotation: "random" });
  for (let i = 0; i < 20; i += 1) {
    const picked = selectAds(s, { device: "desktop", availableWidth: 400, lastShownId: "a", random: Math.random });
    assert.equal(picked[0].id, "b");
  }
  // ...but a single ad is still shown even if it was the last one.
  const only = slot([ad("a", 300)], { rotation: "random" });
  assert.equal(selectAds(only, { device: "desktop", availableWidth: 400, lastShownId: "a" })[0].id, "a");
});

test("priority rotation weights by priority", () => {
  const s = slot([ad("lo", 300, { priority: 1 }), ad("hi", 300, { priority: 9 })], { rotation: "priority" });
  // roll lands in the first 10% -> low priority ad; above that -> high.
  assert.equal(selectAds(s, { device: "desktop", availableWidth: 400, random: () => 0.05 })[0].id, "lo");
  assert.equal(selectAds(s, { device: "desktop", availableWidth: 400, random: () => 0.5 })[0].id, "hi");
});

test("max ads shows several distinct ads", () => {
  const s = slot([ad("a", 300), ad("b", 300), ad("c", 300)], { rotation: "random", max: 2 });
  const picked = selectAds(s, { device: "desktop", availableWidth: 400 });
  assert.equal(picked.length, 2);
  assert.notEqual(picked[0].id, picked[1].id);
});

test("eligibility: status and date window", () => {
  const base = { status: "active", start_date: "2026-10-01", end_date: "2026-10-31" };
  assert.equal(isAdEligible(base, "2026-10-15"), true);
  assert.equal(isAdEligible(base, "2026-09-30"), false);
  assert.equal(isAdEligible(base, "2026-11-01"), false);
  assert.equal(isAdEligible({ ...base, end_date: null }, "2027-01-01"), true);
  assert.equal(isAdEligible({ ...base, status: "inactive" }, "2026-10-15"), false);
  assert.equal(adLifecycle(base, "2026-11-01"), "expired");
  assert.equal(adLifecycle(base, "2026-09-01"), "scheduled");
  assert.equal(adLifecycle(base, "2026-10-15"), "live");
  assert.equal(adLifecycle({ ...base, status: "inactive" }, "2026-10-15"), "inactive");
});

test("Karachi date rolls over at Pakistan midnight, not UTC", () => {
  // 20:00 UTC on the 14th is already 01:00 on the 15th in Pakistan.
  assert.equal(todayInKarachi(new Date("2026-10-14T20:00:00Z")), "2026-10-15");
});

test("target URLs: http(s) only, no credentials, tracking params untouched", () => {
  assert.equal(isSafeTargetUrl("https://shop.example/p?aff=123&utm_source=gp"), true);
  assert.equal(isSafeTargetUrl("http://shop.example/"), true);
  assert.equal(isSafeTargetUrl("javascript:alert(1)"), false);
  assert.equal(isSafeTargetUrl("data:text/html,x"), false);
  assert.equal(isSafeTargetUrl("https://user:pw@shop.example/"), false);
  assert.equal(isSafeTargetUrl("//evil.example"), false);
  assert.equal(isSafeTargetUrl(""), false);
});

test("bots, device buckets and CTR", () => {
  assert.equal(isLikelyBot("Googlebot/2.1"), true);
  assert.equal(isLikelyBot(""), true);
  assert.equal(isLikelyBot("Mozilla/5.0 (Windows NT 10.0) Chrome/120"), false);
  assert.equal(deviceBucket(375), "mobile");
  assert.equal(deviceBucket(800), "tablet");
  assert.equal(deviceBucket(1280), "desktop");
  assert.equal(ctr(0, 0), 0);
  assert.equal(ctr(200, 5), 2.5);
});

test("article splitting: after the 3rd top-level paragraph, never inside a list/table", () => {
  const p = (n) => `<p>para ${n}</p>`;
  const html = p(1) + p(2) + "<ul><li><p>x</p></li><li><p>y</p></li></ul>" + p(3) + p(4) + p(5);
  const [first, second] = splitHtmlAfterParagraph(html, 3);
  assert.ok(first.endsWith("<p>para 3</p>"));
  assert.ok(first.includes("<ul>") && first.includes("</ul>"), "list stays whole in the first half");
  assert.ok(second.startsWith("<p>para 4</p>"));
  assert.equal(first + second, html);
});

test("short articles are not split", () => {
  assert.equal(splitHtmlAfterParagraph("<p>a</p><p>b</p><p>c</p><p>d</p>", 3), null);
  assert.equal(splitHtmlAfterParagraph("", 3), null);
  assert.equal(splitHtmlAfterParagraph(null, 3), null);
});

test("ticker shows every eligible ad, highest priority first, up to the maximum", () => {
  const s = slot([ad("a", 300, { priority: 2 }), ad("b", 728, { priority: 9 }), ad("c", 160, { priority: 5 })], { max: 2, mode: "ticker" });
  assert.deepEqual(selectTickerAds(s, { device: "desktop" }).map((x) => x.id), ["b", "c"]);
  assert.deepEqual(selectTickerAds({ ...s, mobile: false }, { device: "mobile" }), []);
  assert.deepEqual(selectTickerAds(null, { device: "desktop" }), []);
});

test("ticker layout scales banners to one row height and repeats to fill the width", () => {
  const ads = [ad("lb", 728, { height: 90 }), ad("sq", 300, { height: 300 })];
  const layout = tickerLayout(ads, 1000);
  assert.deepEqual(layout.items.map((item) => [item.width, item.height]), [[728, 90], [100, 100]]);
  // one set = 728 + 100 + 2 gaps of 24 = 876 -> needs 2 repeats to cover 1000px
  assert.equal(layout.repeats, 2);
  assert.ok(layout.duration >= 10);
  // a single narrow banner repeats many times rather than leaving a gap
  assert.ok(tickerLayout([ad("s", 100, { height: 100 })], 1100).repeats >= 9);
  assert.deepEqual(tickerLayout([], 1000).items, []);
});
