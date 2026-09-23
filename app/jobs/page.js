import Link from "next/link";
import Button from "../components/Button";
import JobCard from "../components/JobCard";
import JobSortSelect from "../components/JobSortSelect";
import Breadcrumbs from "../components/Breadcrumbs";
import { createPublicClient } from "@/utils/supabase/public";
import {
  fetchActiveJobCategories,
  buildJobCategoryTree,
  findJobCategoryInTree,
  getJobCategoryIdsUnderParent,
} from "@/lib/jobCategories";
import { isPublishedJob, matchesCity, matchesCategoryIds } from "@/lib/seo/jobListings";
import { PK_CITIES } from "../data/directoryCities";
import { EMPLOYMENT_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from "../data/jobOptions";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Find Jobs in Pakistan",
  description:
    "Discover job opportunities from businesses listed on Green Pages PK. Search by category, city, and keyword — apply directly on Green Pages, via WhatsApp, email, or the employer's website.",
  alternates: { canonical: "/jobs" },
};

export const revalidate = 60;

const PAGE_SIZE = 10;

// A curated subset shown as cards on the hub page — the full category list
// is always available via "View All Categories", same curation pattern
// already used for the homepage/business directory's category grid.
const POPULAR_CATEGORY_SLUGS = [
  "technology-it",
  "digital-marketing-seo",
  "sales-customer-service",
  "finance-accounting",
  "healthcare-medical",
  "education-training",
  "design-creative",
  "engineering",
  "human-resources",
  "construction-real-estate",
  "retail-ecommerce",
  "hospitality-tourism",
  "logistics-transportation",
  "remote-freelance",
  "internships-entry-level",
];

function buildQueryString(params, overrides) {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}

function sortJobs(jobs, sort, query) {
  const list = [...jobs];
  switch (sort) {
    case "oldest":
      return list.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
    case "deadline":
      return list.sort((a, b) => {
        if (!a.application_deadline) return 1;
        if (!b.application_deadline) return -1;
        return new Date(a.application_deadline) - new Date(b.application_deadline);
      });
    case "featured":
      return list.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return new Date(b.published_at) - new Date(a.published_at);
      });
    case "relevant": {
      if (!query) return list.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      const needle = query.toLowerCase();
      // A real match count against title/company/skills — not a fake
      // score. More matching fields = more relevant.
      const score = (job) =>
        [job.title, job.company_name, job.skills]
          .filter(Boolean)
          .reduce((count, field) => (field.toLowerCase().includes(needle) ? count + 1 : count), 0);
      return list.sort((a, b) => score(b) - score(a) || new Date(b.published_at) - new Date(a.published_at));
    }
    case "newest":
    default:
      return list.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  }
}

// Server Component — every filter is a URL search param, so results stay
// server-rendered, linkable and crawlable (same reasoning as /businesses's
// query-string-driven search, no client-side filter state).
export default async function JobsPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const cityQuery = params?.city?.trim() ?? "";
  const categorySlug = params?.category?.trim() ?? "";
  const employmentType = params?.type?.trim() ?? "";
  const workMode = params?.mode?.trim() ?? "";
  const experienceLevel = params?.experience?.trim() ?? "";
  const verifiedOnly = params?.verified === "1";
  const sort = params?.sort ?? "newest";
  const requestedPage = Math.max(1, parseInt(params?.page ?? "1", 10) || 1);

  const supabase = createPublicClient();

  const [flatCategories, { data: jobRows }] = await Promise.all([
    fetchActiveJobCategories(supabase),
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "published"),
  ]);

  const categoryTree = buildJobCategoryTree(flatCategories);
  const { parent: selectedParent, child: selectedChild } = categorySlug
    ? findJobCategoryInTree(categoryTree, categorySlug)
    : { parent: null, child: null };

  let jobs = (jobRows ?? []).filter(isPublishedJob);

  // Free text, not limited to PK_CITIES — a job can be posted from any
  // Pakistani city (see app/jobs/actions.js), so search has to match
  // whatever was actually typed, same as the business directory's own
  // city search field.
  if (cityQuery) {
    jobs = jobs.filter((job) => matchesCity(job, cityQuery));
  }
  if (selectedChild) {
    jobs = jobs.filter((job) => matchesCategoryIds(job, [selectedChild.id]));
  } else if (selectedParent) {
    const ids = getJobCategoryIdsUnderParent(selectedParent);
    jobs = jobs.filter((job) => matchesCategoryIds(job, ids));
  }
  if (employmentType) {
    jobs = jobs.filter((job) => job.employment_type === employmentType);
  }
  if (workMode) {
    jobs = jobs.filter((job) => job.work_mode === workMode);
  }
  if (experienceLevel) {
    jobs = jobs.filter((job) => job.experience_level === experienceLevel);
  }
  if (verifiedOnly) {
    jobs = jobs.filter((job) => job.is_verified);
  }
  if (query) {
    const needle = query.toLowerCase();
    jobs = jobs.filter((job) =>
      [job.title, job.company_name, job.skills]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle))
    );
  }

  jobs = sortJobs(jobs, sort, query);

  const totalJobs = jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = jobs.slice(pageStart, pageStart + PAGE_SIZE);

  const categoryIdCounts = new Map();
  for (const job of (jobRows ?? []).filter(isPublishedJob)) {
    categoryIdCounts.set(job.category_id, (categoryIdCounts.get(job.category_id) ?? 0) + 1);
  }
  const popularCategories = categoryTree.filter((c) => POPULAR_CATEGORY_SLUGS.includes(c.slug));

  const collectionSchema = buildCollectionPageSchema(
    { name: "Find Jobs in Pakistan", description: metadata.description, path: "/jobs" },
    SITE_URL
  );

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <section className="hero">
        <div className="container">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Jobs" }]} />
          <span className="hero-eyebrow">Jobs</span>
          <h1>Find Jobs in Pakistan</h1>
          <p className="hero-description">
            Discover job opportunities from businesses listed on Green Pages PK.
          </p>

          <form action="/jobs" method="get" className="job-search-form">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search jobs, companies or keywords"
              aria-label="Search jobs, companies or keywords"
            />
            <input
              type="text"
              name="city"
              defaultValue={cityQuery}
              list="pk-cities-suggestions"
              placeholder="Enter city"
              aria-label="Enter city"
            />
            <datalist id="pk-cities-suggestions">
              {PK_CITIES.map((c) => (
                <option value={c.name} key={c.slug} />
              ))}
            </datalist>
            <button type="submit" className="btn btn-primary">
              Search Jobs
            </button>
          </form>
        </div>
      </section>

      <section aria-labelledby="popular-categories-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Browse by Category</span>
            <h2 id="popular-categories-heading">Popular Categories</h2>
          </div>
          <div className="job-category-grid">
            {popularCategories.map((cat) => (
              <Link href={`/jobs/category/${cat.slug}`} className="job-category-card" key={cat.slug}>
                <span className="job-category-icon" aria-hidden="true">
                  {cat.icon}
                </span>
                <span className="job-category-name">{cat.name}</span>
                <span className="job-category-count">
                  {(categoryIdCounts.get(cat.id) ?? 0) +
                    cat.children.reduce((sum, child) => sum + (categoryIdCounts.get(child.id) ?? 0), 0)}{" "}
                  jobs
                </span>
              </Link>
            ))}
          </div>
          <Link href="#browse-all-categories-heading" className="service-link">
            View All Categories →
          </Link>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="job-results-heading">
        <div className="container">
          <div className="job-browse-layout">
            <aside className="job-filters" aria-label="Filters">
              <form action="/jobs" method="get" className="job-filters-form">
                {query && <input type="hidden" name="q" value={query} />}
                {cityQuery && <input type="hidden" name="city" value={cityQuery} />}

                <div className="form-field">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" defaultValue={categorySlug}>
                    <option value="">All Categories</option>
                    {categoryTree.map((parent) => (
                      <optgroup label={parent.name} key={parent.slug}>
                        <option value={parent.slug}>All {parent.name}</option>
                        {parent.children.map((child) => (
                          <option value={child.slug} key={child.slug}>
                            {child.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="type">Employment Type</label>
                  <select id="type" name="type" defaultValue={employmentType}>
                    <option value="">Any Type</option>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option value={t.value} key={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="mode">Work Mode</label>
                  <select id="mode" name="mode" defaultValue={workMode}>
                    <option value="">Any Mode</option>
                    {WORK_MODES.map((m) => (
                      <option value={m.value} key={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="experience">Experience Level</label>
                  <select id="experience" name="experience" defaultValue={experienceLevel}>
                    <option value="">Any Level</option>
                    {EXPERIENCE_LEVELS.map((e) => (
                      <option value={e.value} key={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="job-filter-checkbox">
                  <input type="checkbox" name="verified" value="1" defaultChecked={verifiedOnly} />
                  Verified Jobs Only
                </label>

                <button type="submit" className="btn btn-secondary">
                  Apply Filters
                </button>
                {(query || cityQuery || categorySlug || employmentType || workMode || experienceLevel || verifiedOnly) && (
                  <Link href="/jobs" className="service-link">
                    Clear Filters
                  </Link>
                )}
              </form>
            </aside>

            <div className="job-results">
              <div className="job-results-header">
                <h2 id="job-results-heading">
                  {totalJobs} Job{totalJobs === 1 ? "" : "s"} Found
                </h2>
                <form action="/jobs" method="get" className="job-sort-form">
                  {query && <input type="hidden" name="q" value={query} />}
                  {cityQuery && <input type="hidden" name="city" value={cityQuery} />}
                  {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
                  {employmentType && <input type="hidden" name="type" value={employmentType} />}
                  {workMode && <input type="hidden" name="mode" value={workMode} />}
                  {experienceLevel && <input type="hidden" name="experience" value={experienceLevel} />}
                  {verifiedOnly && <input type="hidden" name="verified" value="1" />}
                  <label htmlFor="sort" className="visually-hidden">
                    Sort by
                  </label>
                  <JobSortSelect defaultValue={sort} />
                  <noscript>
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Sort
                    </button>
                  </noscript>
                </form>
              </div>

              {pageItems.length > 0 ? (
                <div className="job-list">
                  {pageItems.map((job) => (
                    <JobCard job={job} key={job.id} />
                  ))}
                </div>
              ) : (
                <p>
                  No jobs match your search yet.{" "}
                  <Link href="/jobs">Clear filters</Link> to see all open jobs.
                </p>
              )}

              {totalPages > 1 && (
                <nav className="directory-pagination" aria-label="Job results pagination">
                  <Link
                    href={buildQueryString(params, { page: Math.max(1, currentPage - 1) })}
                    className={currentPage === 1 ? "is-disabled" : ""}
                    aria-disabled={currentPage === 1}
                  >
                    ←
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      href={buildQueryString(params, { page: pageNum })}
                      className={pageNum === currentPage ? "is-active" : ""}
                      key={pageNum}
                    >
                      {pageNum}
                    </Link>
                  ))}
                  <Link
                    href={buildQueryString(params, { page: Math.min(totalPages, currentPage + 1) })}
                    className={currentPage === totalPages ? "is-disabled" : ""}
                    aria-disabled={currentPage === totalPages}
                  >
                    →
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="browse-city-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Browse by City</span>
            <h2 id="browse-city-heading">Jobs by City</h2>
          </div>
          <nav className="directory-browse-links" aria-label="Browse jobs by city">
            {PK_CITIES.map((cityOption) => (
              <Link href={`/jobs/city/${cityOption.slug}`} key={cityOption.slug}>
                {cityOption.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section aria-labelledby="browse-all-categories-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">All Categories</span>
            <h2 id="browse-all-categories-heading">Browse Jobs by Category</h2>
          </div>
          <nav className="directory-browse-links" aria-label="Browse jobs by category">
            {categoryTree.map((parent) => (
              <Link href={`/jobs/category/${parent.slug}`} key={parent.slug}>
                {parent.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section aria-labelledby="employer-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="employer-cta-heading">Looking for the right talent?</h2>
            <p>Post your job on Green Pages PK and connect with relevant candidates.</p>
            <div className="cta-actions">
              <Button href="/jobs/post-job" variant="inverted">
                Post a Job
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
