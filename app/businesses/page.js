import Image from "next/image";
import Link from "next/link";
import Button from "../components/Button";
import { createPublicClient } from "@/utils/supabase/public";

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

const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// Server Component — the search form below submits via a plain GET request
// (no client-side JavaScript), so filtering happens server-side by reading
// the "q" search param directly.
export default async function BusinessesPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const supabase = createPublicClient();
  let request = supabase.from("businesses").select("*");

  if (query) {
    const term = `%${query}%`;
    request = request.or(`name.ilike.${term},category.ilike.${term},city.ilike.${term}`);
  }

  const { data } = await request;
  const businesses = (data ?? []).sort((a, b) => {
    const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
    if (planDiff !== 0) return planDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Business Directory</span>
          <h1>Find Verified Businesses Across Pakistan</h1>
          <p className="hero-description">
            Search thousands of listings by name, category, or city — or
            list your own business free in under 3 minutes.
          </p>
          <form action="/businesses" method="get" className="directory-search">
            <label htmlFor="q" className="visually-hidden">
              Search businesses
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={query}
              placeholder="Search by name, category, or city..."
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
          <div className="hero-ctas">
            <Button href="/signup" variant="secondary">
              List Your Business Free
            </Button>
            <Button href="/pricing" variant="secondary">
              View Packages
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="businesses-heading">
        <div className="container">
          <h2 id="businesses-heading" className="visually-hidden">
            {query ? `Results for "${query}"` : "All Businesses"}
          </h2>
          {query && (
            <p className="search-results-note">
              {businesses.length} result{businesses.length === 1 ? "" : "s"} for
              &ldquo;{query}&rdquo; — <Link href="/businesses">clear search</Link>
            </p>
          )}
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <article className="business-card" key={business.id}>
                  {business.logo_url && (
                    <div className="business-card-logo">
                      <Image
                        src={business.logo_url}
                        alt={`${business.name} logo`}
                        width={56}
                        height={56}
                      />
                    </div>
                  )}
                  {business.plan !== "free" && (
                    <span className={`plan-badge plan-badge-${business.plan}`}>
                      {business.plan === "featured" ? "★ Featured" : "✓ Verified"}
                    </span>
                  )}
                  <h3>
                    <Link href={`/businesses/${business.id}`}>{business.name}</Link>
                  </h3>
                  <div className="business-meta">
                    <span>{business.category}</span>
                    {business.city && <span>{business.city}</span>}
                  </div>
                  <p>{business.description}</p>
                  <Link href={`/businesses/${business.id}`} className="service-link">
                    View Profile →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p>
              No businesses found.{" "}
              <Link href="/signup">Be the first to add yours.</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
