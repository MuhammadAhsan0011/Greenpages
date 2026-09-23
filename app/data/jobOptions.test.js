import { test } from "node:test";
import assert from "node:assert/strict";
import { formatSalary, employmentTypeLabel, workModeLabel, experienceLevelLabel } from "./jobOptions.js";

test("negotiable salary always wins over any numbers present", () => {
  assert.equal(formatSalary({ salary_negotiable: true, salary_min: 1000, salary_max: 2000 }), "Negotiable");
});

test("no salary fields set returns null (no fabricated text)", () => {
  assert.equal(formatSalary({ salary_negotiable: false, salary_min: null, salary_max: null }), null);
});

test("a real min/max range formats with the currency and thousands separators", () => {
  assert.equal(
    formatSalary({ salary_negotiable: false, salary_min: 60000, salary_max: 100000, salary_currency: "PKR" }),
    "PKR 60,000 – 100,000"
  );
});

test("only a minimum set formats as an open-ended range", () => {
  assert.equal(
    formatSalary({ salary_negotiable: false, salary_min: 60000, salary_max: null, salary_currency: "PKR" }),
    "PKR 60,000+"
  );
});

test("label lookups fall back to the raw value for an unknown enum", () => {
  assert.equal(employmentTypeLabel("full_time"), "Full-Time");
  assert.equal(workModeLabel("remote"), "Remote");
  assert.equal(experienceLevelLabel("2_5_years"), "2–5 Years");
  assert.equal(employmentTypeLabel("bogus"), "bogus");
});
