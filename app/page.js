import Image from "next/image";
import Link from "next/link";
import Button from "./components/Button";
import ServiceCard from "./components/ServiceCard";
import BlogCard from "./components/BlogCard";
import ReviewList from "./components/ReviewList";
import FeaturedBusinessCard from "./components/FeaturedBusinessCard";
import { services } from "./data/services";
import { normalizeDbArticle } from "./data/blog";
import { BUSINESS_CATEGORIES } from "./data/businessCategories";
import { PK_CITIES } from "./data/directoryCities";
import { createPublicClient } from "@/utils/supabase/public";
import pkHeroPhoto from "../public/images/pakistan-hero-photo.png";

// Revalidates periodically so newly-featured articles/businesses show up
// here without a rebuild, while the page stays cached/static like the rest
// of the site.
export const revalidate = 60;

export const metadata = {
  title: "Pakistan Business Directory & Digital Marketing Agency",
  description:
    "List your business free on Pakistan's directory, or grow it with Green Pages' SEO, web dev & content marketing.",
  alternates: {
    canonical: "/",
  },
};

// A curated subset of BUSINESS_CATEGORIES (real data — name/slug always
// sourced from there, never duplicated) shown on the homepage. Showing all
// 33 would crowd the page; the full list already lives on /businesses.
const FEATURED_CATEGORY_SLUGS = [
  { slug: "it-software-services", icon: "💻" },
  { slug: "healthcare-medical", icon: "🏥" },
  { slug: "food-beverage", icon: "🍔" },
  { slug: "real-estate", icon: "🏠" },
  { slug: "automotive", icon: "🚗" },
  { slug: "education-training", icon: "🎓" },
  { slug: "retail-e-commerce", icon: "🛍️" },
  { slug: "legal-services", icon: "⚖️" },
];

const howItWorks = [
  {
    step: "1",
    icon: "📝",
    title: "Register",
    description: "Create a free account in under a minute — no credit card required.",
  },
  {
    step: "2",
    icon: "🏢",
    title: "Add Your Business",
    description:
      "Fill in your business details, category, and city to build your public profile.",
  },
  {
    step: "3",
    icon: "🔍",
    title: "Get Found",
    description:
      "Your listing goes live instantly in the directory, ready for customers to find you.",
  },
];

const whyChooseUs = [
  {
    icon: "01",
    title: "Data-Driven Strategy",
    description:
      "Every recommendation we make is backed by data, competitor research, and measurable KPIs — not guesswork.",
  },
  {
    icon: "02",
    title: "Transparent Reporting",
    description:
      "You get clear monthly reports tied to real business outcomes, so you always know what your investment is producing.",
  },
  {
    icon: "03",
    title: "Full-Funnel Expertise",
    description:
      "From technical SEO to conversion-focused web development, our team covers every channel that drives growth.",
  },
  {
    icon: "04",
    title: "Dedicated Partnership",
    description:
      "We work as an extension of your team, with a dedicated strategist who understands your goals and industry.",
  },
];

const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// This is a Server Component by default — it renders on the server with
// no client-side JavaScript required, which keeps the homepage fast and
// fully crawlable for search engines.
export default async function HomePage() {
  const supabase = createPublicClient();

  const [
    { data: featuredArticles },
    { data: reviews },
    { count: businessCount },
    { data: allBusinesses },
    { data: reviewRows },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
      .eq("featured_on_homepage", true)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("reviews")
      .select("id, reviewer_name, rating, message, created_at")
      .is("business_id", null)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("businesses").select("*"),
    supabase.from("reviews").select("business_id, rating").eq("approved", true).not("business_id", "is", null),
  ]);

  const featured = (featuredArticles ?? []).map(normalizeDbArticle);

  const featuredBusinesses = (allBusinesses ?? [])
    .sort((a, b) => {
      const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
      if (planDiff !== 0) return planDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .slice(0, 6);

  // Real per-business rating aggregates — only businesses with at least one
  // admin-approved review get a rating shown; most won't have any yet, and
  // that's shown honestly by omitting the rating rather than faking one.
  const ratingsByBusiness = {};
  (reviewRows ?? []).forEach((row) => {
    const entry = ratingsByBusiness[row.business_id] ?? { total: 0, count: 0 };
    entry.total += row.rating;
    entry.count += 1;
    ratingsByBusiness[row.business_id] = entry;
  });

  // Real per-category counts, computed the same way /businesses/category/
  // pages query them (exact match on the category name).
  const categoryCounts = (allBusinesses ?? []).reduce((acc, business) => {
    acc[business.category] = (acc[business.category] ?? 0) + 1;
    return acc;
  }, {});

  const featuredCategories = FEATURED_CATEGORY_SLUGS.map(({ slug, icon }) => {
    const category = BUSINESS_CATEGORIES.find((c) => c.slug === slug);
    return { ...category, icon, count: categoryCounts[category.name] ?? 0 };
  });

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">#1 Business Directory in Pakistan</span>
            <h1>
              Find Verified Businesses Across <span className="text-accent">Pakistan</span>
            </h1>
            <p className="hero-description">
              Search thousands of trusted businesses by name, category, or
              city — or list your own business free in under 3 minutes.
            </p>
          </div>
          <div className="hero-image">
            <Image
              src={pkHeroPhoto}
              alt="Minar-e-Pakistan and a waving Pakistan flag against the Karachi skyline"
              priority
              sizes="(max-width: 900px) 100vw, 560px"
            />
          </div>
        </div>

        <div className="container">
            <div className="hero-search-card">
              <input
                type="radio"
                name="hero-search-tab"
                id="hero-tab-businesses"
                className="hero-tab-radio"
                defaultChecked
              />
              <input
                type="radio"
                name="hero-search-tab"
                id="hero-tab-categories"
                className="hero-tab-radio"
              />
              <input
                type="radio"
                name="hero-search-tab"
                id="hero-tab-cities"
                className="hero-tab-radio"
              />

              <div className="hero-tab-bar">
                <label htmlFor="hero-tab-businesses">Businesses</label>
                <label htmlFor="hero-tab-categories">Categories</label>
                <label htmlFor="hero-tab-cities">Cities</label>
              </div>

              <div id="hero-panel-businesses" className="hero-tab-panel">
                <form action="/businesses" method="get" className="hero-search-form">
                  <label htmlFor="hero-q" className="visually-hidden">
                    Search by name or keyword
                  </label>
                  <input id="hero-q" name="q" type="text" placeholder="Search by name or keyword..." />
                  <label htmlFor="hero-city-text" className="visually-hidden">
                    City
                  </label>
                  <input id="hero-city-text" name="city" type="text" placeholder="Enter city..." />
                  <button type="submit" className="btn btn-primary">
                    Search
                  </button>
                </form>
              </div>

              <div id="hero-panel-categories" className="hero-tab-panel">
                <form action="/businesses" method="get" className="hero-search-form">
                  <label htmlFor="hero-category" className="visually-hidden">
                    Choose a category
                  </label>
                  <select id="hero-category" name="q" defaultValue="">
                    <option value="" disabled>
                      Choose a category
                    </option>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <option value={category.name} key={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-primary">
                    Browse
                  </button>
                </form>
              </div>

              <div id="hero-panel-cities" className="hero-tab-panel">
                <form action="/businesses" method="get" className="hero-search-form">
                  <label htmlFor="hero-city" className="visually-hidden">
                    Choose a city
                  </label>
                  <select id="hero-city" name="city" defaultValue="">
                    <option value="" disabled>
                      Choose a city
                    </option>
                    {PK_CITIES.map((city) => (
                      <option value={city.name} key={city.slug}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-primary">
                    Browse
                  </button>
                </form>
              </div>
            </div>

            <div className="hero-trust-badges">
              <span className="hero-trust-badge">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                100% Verified Listings
              </span>
              <span className="hero-trust-badge">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m8.7 10.7 6.6-3.4M8.7 13.3l6.6 3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Boost Local Visibility
              </span>
              <span className="hero-trust-badge">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 18V9M10 18V5M16 18v-7M22 5l-6 6-4-4-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Grow Your Business
              </span>
            </div>
        </div>
      </section>

      <section aria-labelledby="categories-heading">
        <div className="container">
          <div className="section-header-row">
            <div className="section-header">
              <span className="section-eyebrow">Browse Popular Categories</span>
              <h2 id="categories-heading">Explore Top Business Categories</h2>
            </div>
            <Link href="/businesses" className="service-link">
              View all categories →
            </Link>
          </div>
          <div className="category-pill-grid">
            {featuredCategories.map((category) => (
              <Link
                href={`/businesses/category/${category.slug}`}
                className="category-pill-card"
                key={category.slug}
              >
                <span className="category-pill-icon" aria-hidden="true">
                  {category.icon}
                </span>
                <span>
                  <span className="category-pill-name">{category.name}</span>
                  {category.count > 0 && (
                    <span className="category-pill-count">
                      {category.count} Listing{category.count === 1 ? "" : "s"}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-bar" aria-label="Green Pages by the numbers">
        <div className="container stats-bar-inner">
          <div className="stat-item">
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <span className="stat-value">{businessCount ?? 0}</span>
            <span className="stat-label">Businesses Listed</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M3 21V10l9-6 9 6v11" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 21v-7h6v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="stat-value">5</span>
            <span className="stat-label">Cities Covered</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
                <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <span className="stat-value">33</span>
            <span className="stat-label">Business Categories</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 4v16h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M7 15l4-5 4 3 5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="stat-value">100%</span>
            <span className="stat-label">Free to Get Started</span>
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="how-it-works-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">How It Works</span>
            <h2 id="how-it-works-heading">Get Listed in 3 Easy Steps</h2>
          </div>
          <div className="how-it-works-grid">
            <div className="how-it-works-circles">
              {howItWorks.map((item) => (
                <div className="how-it-works-circle-step" key={item.step}>
                  <span className="how-it-works-circle" aria-hidden="true">
                    {item.icon}
                    <span className="how-it-works-circle-number">{item.step}</span>
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
            <div className="how-it-works-cta-card">
              <h3>List Your Business Today</h3>
              <p>
                Join businesses across Pakistan already growing with Green
                Pages PK.
              </p>
              <ul className="how-it-works-checklist">
                <li>Increase Visibility</li>
                <li>Get More Customers</li>
                <li>Build Trust &amp; Credibility</li>
                <li>100% Free &amp; Easy</li>
              </ul>
              <Button href="/signup" variant="primary">
                Add Your Business Now
              </Button>
            </div>
          </div>
        </div>
      </section>

      {featuredBusinesses.length > 0 && (
        <section aria-labelledby="featured-businesses-heading">
          <div className="container">
            <div className="section-header-row">
              <div className="section-header">
                <span className="section-eyebrow">Featured Businesses</span>
                <h2 id="featured-businesses-heading">Popular &amp; Verified Listings</h2>
              </div>
              <Link href="/businesses" className="service-link">
                View all listings →
              </Link>
            </div>
            <div className="grid grid-3">
              {featuredBusinesses.map((business) => (
                <FeaturedBusinessCard
                  business={business}
                  rating={ratingsByBusiness[business.id]}
                  key={business.id}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="section-alt" aria-labelledby="featured-articles-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">From the Community</span>
              <h2 id="featured-articles-heading">Featured Articles</h2>
            </div>
            <div className="grid grid-3">
              {featured.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="services-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">What We Do</span>
            <h2 id="services-heading">Services Built to Move the Needle</h2>
            <p>
              We combine three core disciplines — search, development, and
              content — into one connected growth strategy for your
              business.
            </p>
          </div>
          <div className="grid grid-3">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="why-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Why Green Pages</span>
            <h2 id="why-heading">Why Businesses Choose Us</h2>
            <p>
              We&apos;ve helped companies across industries turn organic
              search and content into a predictable growth channel.
            </p>
          </div>
          <div className="grid grid-2">
            {whyChooseUs.map((item) => (
              <div className="feature-item" key={item.title}>
                <span className="feature-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {reviews && reviews.length > 0 && (
        <section aria-labelledby="reviews-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Reviews</span>
              <h2 id="reviews-heading">What People Say About Green Pages</h2>
            </div>
            <ReviewList reviews={reviews} />
            <div className="hero-ctas">
              <Button href="/reviews" variant="primary">
                Read All Reviews
              </Button>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="cta-heading">
        <div className="container">
          <div className="skyline-banner">
            <div className="skyline-banner-content">
              <h2 id="cta-heading">Ready to Grow Your Business?</h2>
              <p>
                List your business on Green Pages PK and get discovered by
                customers across Pakistan.
              </p>
              <div className="skyline-banner-actions">
                <Button href="/signup" variant="inverted">
                  Add Your Business
                </Button>
                <Button href="/pricing" variant="secondarytwo">
                  View Pricing Plans
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
