// JobPosting structured data — only emits fields that are actually true/
// present on the row. Never fabricates salary, location, employer or dates
// per the site's SEO rules (see CLAUDE.md and docs/seo/jobs-migration.sql).

const EMPLOYMENT_TYPE_SCHEMA = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  temporary: "TEMPORARY",
  internship: "INTERN",
  freelance: "CONTRACTOR",
  apprenticeship: "OTHER",
};

export function buildJobPostingSchema(job, siteUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.published_at,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name,
      ...(job.company_logo_url && { logo: job.company_logo_url }),
    },
  };

  const employmentType = EMPLOYMENT_TYPE_SCHEMA[job.employment_type];
  if (employmentType) schema.employmentType = employmentType;

  if (job.application_deadline) {
    schema.validThrough = new Date(job.application_deadline).toISOString();
  }

  // Real address, only if a real city is on the row — no placeholder
  // location ever emitted.
  if (job.city) {
    schema.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        ...(job.area && { addressRegion: job.area }),
        addressCountry: "PK",
      },
    };
  }

  if (job.work_mode === "remote") {
    schema.jobLocationType = "TELECOMMUTE";
    // Google requires applicantLocationRequirements alongside TELECOMMUTE —
    // real country value, not a placeholder.
    schema.applicantLocationRequirements = {
      "@type": "Country",
      name: job.country || "Pakistan",
    };
  }

  // Only a real numeric range the employer actually entered — never a
  // fabricated figure, and never emitted when they marked it negotiable.
  if (!job.salary_negotiable && job.salary_min && job.salary_max) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salary_currency || "PKR",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salary_min,
        maxValue: job.salary_max,
        unitText: "MONTH",
      },
    };
  }

  if (siteUrl && job.slug) {
    schema.url = `${siteUrl}/jobs/${job.slug}`;
  }

  return schema;
}
