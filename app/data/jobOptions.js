// Static enum option lists + human-readable labels for jobs.* check
// constraints (see docs/seo/jobs-migration.sql) — one place so the form
// dropdowns, job cards, detail pages, filters and admin views can't drift
// out of sync with each other or with the DB constraint.

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "apprenticeship", label: "Apprenticeship" },
];

export const WORK_MODES = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

export const EXPERIENCE_LEVELS = [
  { value: "no_experience", label: "No Experience" },
  { value: "entry_level", label: "Entry Level" },
  { value: "1_2_years", label: "1–2 Years" },
  { value: "2_5_years", label: "2–5 Years" },
  { value: "5_10_years", label: "5–10 Years" },
  { value: "10_plus_years", label: "10+ Years" },
];

export const JOB_STATUS_LABELS = {
  pending_review: "Pending Review",
  published: "Published",
  rejected: "Rejected",
  expired: "Expired",
  closed: "Closed",
};

export const JOB_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "deadline", label: "Deadline Soon" },
  { value: "relevant", label: "Relevant Jobs" },
  { value: "featured", label: "Featured Jobs" },
];

function labelFor(list, value) {
  return list.find((item) => item.value === value)?.label ?? value;
}

export function employmentTypeLabel(value) {
  return labelFor(EMPLOYMENT_TYPES, value);
}

export function workModeLabel(value) {
  return labelFor(WORK_MODES, value);
}

export function experienceLevelLabel(value) {
  return labelFor(EXPERIENCE_LEVELS, value);
}

// e.g. "PKR 60,000 – 100,000" / "PKR 60,000+" / "Negotiable" — never
// fabricates a number that isn't actually on the row.
export function formatSalary(job) {
  if (job.salary_negotiable) return "Negotiable";
  if (!job.salary_min && !job.salary_max) return null;
  const currency = job.salary_currency || "PKR";
  if (job.salary_min && job.salary_max) {
    return `${currency} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`;
  }
  const single = job.salary_min || job.salary_max;
  return `${currency} ${single.toLocaleString()}+`;
}
