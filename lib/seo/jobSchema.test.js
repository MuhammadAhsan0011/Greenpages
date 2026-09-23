import { test } from "node:test";
import assert from "node:assert/strict";
import { buildJobPostingSchema } from "./jobSchema.js";

function makeJob(overrides = {}) {
  return {
    title: "SEO Executive",
    description: "Do SEO work.",
    published_at: "2026-08-27T09:57:00Z",
    company_name: "EI Commodities",
    company_logo_url: null,
    employment_type: "full_time",
    application_deadline: null,
    city: null,
    area: null,
    work_mode: "onsite",
    country: "Pakistan",
    salary_negotiable: false,
    salary_min: null,
    salary_max: null,
    salary_currency: "PKR",
    slug: "seo-executive-ei-commodities",
    ...overrides,
  };
}

test("always includes the required core fields", () => {
  const schema = buildJobPostingSchema(makeJob(), "https://www.greenpagespk.com");
  assert.equal(schema["@type"], "JobPosting");
  assert.equal(schema.title, "SEO Executive");
  assert.equal(schema.description, "Do SEO work.");
  assert.equal(schema.datePosted, "2026-08-27T09:57:00Z");
  assert.equal(schema.hiringOrganization.name, "EI Commodities");
});

test("does not emit jobLocation when no city is set", () => {
  const schema = buildJobPostingSchema(makeJob(), "https://www.greenpagespk.com");
  assert.equal(schema.jobLocation, undefined);
});

test("emits jobLocation only when a real city is present", () => {
  const schema = buildJobPostingSchema(makeJob({ city: "Karachi" }), "https://www.greenpagespk.com");
  assert.equal(schema.jobLocation.address.addressLocality, "Karachi");
});

test("remote jobs get TELECOMMUTE + applicantLocationRequirements", () => {
  const schema = buildJobPostingSchema(makeJob({ work_mode: "remote" }), "https://www.greenpagespk.com");
  assert.equal(schema.jobLocationType, "TELECOMMUTE");
  assert.equal(schema.applicantLocationRequirements.name, "Pakistan");
});

test("does not fabricate a salary when not set", () => {
  const schema = buildJobPostingSchema(makeJob(), "https://www.greenpagespk.com");
  assert.equal(schema.baseSalary, undefined);
});

test("does not emit baseSalary when marked negotiable, even with numbers present", () => {
  const schema = buildJobPostingSchema(
    makeJob({ salary_negotiable: true, salary_min: 60000, salary_max: 100000 }),
    "https://www.greenpagespk.com"
  );
  assert.equal(schema.baseSalary, undefined);
});

test("emits a real baseSalary range when both bounds are set and not negotiable", () => {
  const schema = buildJobPostingSchema(
    makeJob({ salary_min: 60000, salary_max: 100000 }),
    "https://www.greenpagespk.com"
  );
  assert.equal(schema.baseSalary.value.minValue, 60000);
  assert.equal(schema.baseSalary.value.maxValue, 100000);
  assert.equal(schema.baseSalary.currency, "PKR");
});

test("maps employment types to schema.org enum values", () => {
  assert.equal(buildJobPostingSchema(makeJob({ employment_type: "part_time" })).employmentType, "PART_TIME");
  assert.equal(buildJobPostingSchema(makeJob({ employment_type: "internship" })).employmentType, "INTERN");
  assert.equal(buildJobPostingSchema(makeJob({ employment_type: "freelance" })).employmentType, "CONTRACTOR");
});

test("only sets validThrough when a real deadline exists", () => {
  assert.equal(buildJobPostingSchema(makeJob()).validThrough, undefined);
  const withDeadline = buildJobPostingSchema(makeJob({ application_deadline: "2026-12-31" }));
  assert.equal(withDeadline.validThrough, new Date("2026-12-31").toISOString());
});

test("builds the canonical job URL from siteUrl + slug", () => {
  const schema = buildJobPostingSchema(makeJob(), "https://www.greenpagespk.com");
  assert.equal(schema.url, "https://www.greenpagespk.com/jobs/seo-executive-ei-commodities");
});
