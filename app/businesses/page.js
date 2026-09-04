import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Button from "../components/Button";
import DirectoryListItem from "../components/DirectoryListItem";
import SortSelect from "../components/SortSelect";
import { createPublicClient } from "@/utils/supabase/public";
import { PK_CITIES } from "../data/directoryCities";
import { BUSINESS_CATEGORIES } from "../data/businessCategories";

export const metadata = {
  title: "Pakistan Business Directory",
  description:
    "Search verified businesses across Pakistan on Green Pages — browse by category or city, or list your own business free in minutes.",
  alternates: {
    canonical: "/businesses",
  },
};

// Revalidates every 60 seconds: fresh enough to reflect new sign-ups
// quickly, while still being cached and crawlable like the rest of the site.
export const revalidate = 60;

const PAGE_SIZE = 10;
const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// Real categories, chosen for broad recognizability — not literally "Doctors"
// or "Plumbers" like a generic template might show, since those aren't real
// categories in this directory.
const POPULAR_SEARCH_SLUGS = [
  "food-beverage",
  "healthcare-medical",
  "real-estate",
  "automotive",
  "retail-e-commerce",
];
const popularSearchCategories = POPULAR_SEARCH_SLUGS.map((slug) =>
  BUSINESS_CATEGORIES.find((c) => c.slug === slug)
);

// A curated subset shown in the sidebar (the full 33 already live on the
// "All Categories" link below them) — same curation as the homepage's
// category grid, for consistency.
const SIDEBAR_CATEGORY_SLUGS = [
  "it-software-services",
  "healthcare-medical",
  "food-beverage",
  "real-estate",
  "automotive",
  "education-training",
  "retail-e-commerce",
  "professional-services",
  "construction-real-estate",
  "fashion-apparel",
  "legal-services",
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
  return qs ? `/businesses?${qs}` : "/businesses";
}

// Server Component — the search form below submits via a plain GET request
// (no client-side JavaScript), so filtering, sorting, and pagination all
// happen server-side by reading the URL's search params directly.
export default async function BusinessesPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const city = params?.city?.trim() ?? "";
  const category = params?.category?.trim() ?? "";
  const sort = params?.sort ?? "newest";
  const requestedPage = Math.max(1, parseInt(params?.page ?? "1", 10) || 1);

  // A category with no other active filter has a clean, canonical URL at
  // /businesses/category/[slug] — redirect messy query-string links
  // (?category=Food+%26+Beverage) there instead of rendering them here.
  if (category && !query && !city) {
    const matchedCategory = BUSINESS_CATEGORIES.find((c) => c.name === category);
    if (matchedCategory) {
      redirect(`/businesses/category/${matchedCategory.slug}`);
    }
  }

  const supabase = createPublicClient();
  let request = supabase.from("businesses").select("*");

  if (query) {
    // Quoted per PostgREST's reserved-character rules: unescaped commas
    // (e.g. searching the "Chemicals, Rubber & Plastics" category) would
    // otherwise be parsed as separators between the OR conditions below.
    const escaped = query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const term = `"%${escaped}%"`;
    request = request.or(`name.ilike.${term},category.ilike.${term},city.ilike.${term}`);
  }
  if (city) {
    request = request.ilike("city", `%${city}%`);
  }
  if (category) {
    request = request.eq("category", category);
  }

  const [{ data }, { data: reviewRows }, { data: allCategories }] = await Promise.all([
    request,
    supabase.from("reviews").select("business_id, rating").eq("approved", true).not("business_id", "is", null),
    supabase.from("businesses").select("category"),
  ]);

  const ratingsByBusiness = {};
  (reviewRows ?? []).forEach((row) => {
    const entry = ratingsByBusiness[row.business_id] ?? { total: 0, count: 0 };
    entry.total += row.rating;
    entry.count += 1;
    ratingsByBusiness[row.business_id] = entry;
  });

  // Real per-category counts across the whole directory (not scoped to the
  // current search), so the sidebar always reflects the true distribution.
  const categoryCounts = (allCategories ?? []).reduce((acc, row) => {
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  const sidebarCategories = SIDEBAR_CATEGORY_SLUGS.map((slug) => {
    const found = BUSINESS_CATEGORIES.find((c) => c.slug === slug);
    return { ...found, count: categoryCounts[found.name] ?? 0 };
  });

  let businesses = [...(data ?? [])];

  if (sort === "oldest") {
    businesses.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sort === "rating") {
    businesses.sort((a, b) => {
      const ra = ratingsByBusiness[a.id] ? ratingsByBusiness[a.id].total / ratingsByBusiness[a.id].count : -1;
      const rb = ratingsByBusiness[b.id] ? ratingsByBusiness[b.id].total / ratingsByBusiness[b.id].count : -1;
      return rb - ra;
    });
  } else if (sort === "name") {
    businesses.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // "newest" (default) — paid plans still surface first, newest within each.
    businesses.sort((a, b) => {
      const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
      if (planDiff !== 0) return planDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  const totalResults = businesses.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = businesses.slice(pageStart, pageStart + PAGE_SIZE);

  const activeParams = { q: query, city, category, sort: sort !== "newest" ? sort : "", page: "" };

  return (
    <>
      <section className="hero directory-hero">
        <div className="container hero-inner">
          <div>
            <p className="breadcrumbs">
              <Link href="/">Home</Link> / Directory
            </p>
            <span className="hero-eyebrow">Business Directory</span>
            <h1>
              Find Verified Businesses Across <span className="text-accent">Pakistan</span>
            </h1>
            <p className="hero-description">
              Explore thousands of trusted businesses by category, location,
              or keyword. Connect with the best services near you.
            </p>
          </div>
          <div className="hero-image-wide">
            <Image
              src="/images/directory-hero-photo.png"
              alt="Illustration of a Pakistani city skyline with location pins marking businesses on a map"
              width={1120}
              height={896}
            />
          </div>
        </div>

        <div className="container">
          <div className="directory-search-card">
            <form action="/businesses" method="get" className="directory-search-bar">
              <div className="directory-search-field">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <label htmlFor="q" className="visually-hidden">
                  Search businesses
                </label>
                <input id="q" name="q" type="text" defaultValue={query} placeholder="Search by name or keyword..." />
              </div>

              <div className="directory-search-field">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <label htmlFor="city" className="visually-hidden">
                  City or post code
                </label>
                <input id="city" name="city" type="text" defaultValue={city} placeholder="Enter City or Post Code..." />
              </div>

              <div className="directory-search-field directory-search-field-select">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <label htmlFor="category" className="visually-hidden">
                  Category
                </label>
                <select id="category" name="category" defaultValue={category}>
                  <option value="">All Categories</option>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option value={c.name} key={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            <div className="directory-popular-searches">
              <span>Popular Searches:</span>
              {popularSearchCategories.map((c) => (
                <Link href={`/businesses/category/${c.slug}`} className="directory-popular-pill" key={c.slug}>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="businesses-heading">
        <div className="container">
          <div className="directory-layout">
            <aside className="wizard-sidebar">
              <div className="wizard-sidebar-card">
                <h3>Categories</h3>
                <ul className="directory-category-list">
                  <li>
                    <Link href="/businesses" className={category === "" ? "is-active" : ""}>
                      All Categories
                    </Link>
                  </li>
                  {sidebarCategories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/businesses/category/${c.slug}`}
                        className={category === c.name ? "is-active" : ""}
                      >
                        {c.name}
                        {c.count > 0 && <span>{c.count}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/businesses#browse-category-heading" className="service-link">
                  More Categories →
                </Link>
              </div>

              <div className="wizard-sidebar-card listing-cta-card">
                <h3>List Your Business Today!</h3>
                <p>Get discovered by thousands of potential customers.</p>
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Add Your Business
                </Link>
              </div>
            </aside>

            <div className="directory-results">
              <div className="directory-results-header">
                <div>
                  <h2 id="businesses-heading">All Businesses</h2>
                  <p className="directory-results-count">
                    {totalResults > 0
                      ? `Showing ${pageStart + 1}-${Math.min(pageStart + PAGE_SIZE, totalResults)} of ${totalResults} results`
                      : "No results found"}
                  </p>
                </div>
                <form action="/businesses" method="get" className="directory-sort-form">
                  <input type="hidden" name="q" value={query} />
                  <input type="hidden" name="city" value={city} />
                  <input type="hidden" name="category" value={category} />
                  <label htmlFor="sort" className="visually-hidden">
                    Sort by
                  </label>
                  <SortSelect defaultValue={sort} />
                </form>
              </div>

              {(query || city || category) && (
                <p className="search-results-note">
                  {query && <>for &ldquo;{query}&rdquo; </>}
                  {city && <>in &ldquo;{city}&rdquo; </>}
                  {category && <>in {category} </>}
                  — <Link href="/businesses">clear filters</Link>
                </p>
              )}

              {pageItems.length > 0 ? (
                <div className="directory-list">
                  {pageItems.map((business) => (
                    <DirectoryListItem
                      business={business}
                      rating={ratingsByBusiness[business.id]}
                      key={business.id}
                    />
                  ))}
                </div>
              ) : (
                <p>
                  No businesses found.{" "}
                  <Link href="/signup">Be the first to add yours.</Link>
                </p>
              )}

              {totalPages > 1 && (
                <nav className="directory-pagination" aria-label="Directory pagination">
                  <Link
                    href={buildQueryString(activeParams, { page: Math.max(1, currentPage - 1) })}
                    className={currentPage === 1 ? "is-disabled" : ""}
                    aria-disabled={currentPage === 1}
                  >
                    ←
                  </Link>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      href={buildQueryString(activeParams, { page: pageNum })}
                      className={pageNum === currentPage ? "is-active" : ""}
                      key={pageNum}
                    >
                      {pageNum}
                    </Link>
                  ))}
                  <Link
                    href={buildQueryString(activeParams, { page: Math.min(totalPages, currentPage + 1) })}
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
            <h2 id="browse-city-heading">Directories by City</h2>
          </div>
          <nav className="directory-browse-links" aria-label="Browse by city">
            {PK_CITIES.map((cityOption) => (
              <Link href={`/businesses/city/${cityOption.slug}`} key={cityOption.slug}>
                {cityOption.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section aria-labelledby="browse-category-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Browse by Category</span>
            <h2 id="browse-category-heading">Directories by Category</h2>
          </div>
          <nav className="directory-browse-links" aria-label="Browse by category">
            {BUSINESS_CATEGORIES.map((categoryOption) => (
              <Link
                href={`/businesses/category/${categoryOption.slug}`}
                key={categoryOption.slug}
              >
                {categoryOption.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
