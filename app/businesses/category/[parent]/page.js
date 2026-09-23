import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../components/Button";
import BusinessCard from "../../../components/BusinessCard";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { createPublicClient } from "@/utils/supabase/public";
import { getAllParents, getParent } from "../../../data/businessCategories";
import { PK_CITIES } from "../../../data/directoryCities";
import { PLAN_RANK } from "../../../data/plans";
import { filterForParent } from "@/lib/seo/businessListings";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// Pre-renders one parent-level aggregate page per top-level directory
// category at build time.
export async function generateStaticParams() {
  return getAllParents().map((parent) => ({ parent: parent.slug }));
}

export async function generateMetadata({ params }) {
  const { parent: parentSlug } = await params;
  const parent = getParent(parentSlug);

  if (!parent) {
    return { title: "Category Not Found" };
  }

  const supabase = createPublicClient();
  const { data } = await supabase.from("businesses").select("*").eq("category", parent.name);
  const businesses = filterForParent(data ?? [], parent.name);

  const title = parent.metaTitle || `${parent.name} Businesses in Pakistan | Green Pages`;
  const description =
    parent.metaDescription ||
    `Find verified ${parent.name} businesses across Pakistan on Green Pages — search by city, or list your own business free.`.slice(
      0,
      155
    );

  return {
    title,
    description,
    alternates: {
      canonical: `/businesses/category/${parent.slug}`,
    },
    robots: getArchiveRobots(businesses.length),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/businesses/category/${parent.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Server Component — a directory landing page scoped to one parent
// category. businesses.category always holds a parent-level name (never a
// child name — those live in .subcategory), so a plain equality match is
// enough to pick up every business under this parent, children included —
// which is also exactly why this single query's row count is already the
// correct "parent aggregates its children" indexing count, no second query
// needed.
export default async function ParentCategoryDirectoryPage({ params }) {
  const { parent: parentSlug } = await params;
  const parent = getParent(parentSlug);

  if (!parent) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data } = await supabase.from("businesses").select("*").eq("category", parent.name);

  const businesses = filterForParent(data ?? [], parent.name).sort((a, b) => {
    const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
    if (planDiff !== 0) return planDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Children/cities to surface in nav are grouped from this same fetched
  // set — zero extra queries, and guarantees the nav never links a child or
  // city that turns out to render empty.
  const childCounts = businesses.reduce((acc, b) => {
    if (b.subcategory) acc[b.subcategory] = (acc[b.subcategory] ?? 0) + 1;
    return acc;
  }, {});
  const childrenWithListings = parent.children.filter((child) => (childCounts[child.name] ?? 0) > 0);

  const cityCounts = businesses.reduce((acc, b) => {
    if (b.city) acc[b.city.toLowerCase()] = (acc[b.city.toLowerCase()] ?? 0) + 1;
    return acc;
  }, {});
  const relevantCities = PK_CITIES.filter((city) =>
    Object.keys(cityCounts).some((cityKey) => cityKey.includes(city.name.toLowerCase()))
  );

  const otherParents = getAllParents().filter((p) => p.slug !== parent.slug);

  const collectionSchema = buildCollectionPageSchema(
    {
      name: `${parent.name} Businesses in Pakistan`,
      description: parent.description || undefined,
      path: `/businesses/category/${parent.slug}`,
    },
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
          <Breadcrumbs
            items={[
              { name: "Business Directory", path: "/businesses" },
              { name: parent.name },
            ]}
          />
          <span className="hero-eyebrow">Business Directory</span>
          <h1>{parent.name} Businesses in Pakistan</h1>
          {parent.description && <p className="hero-description">{parent.description}</p>}
          <div className="hero-ctas">
            <Button href="/signup" variant="secondary">
              List Your Business Free
            </Button>
            <Button href="/businesses" variant="secondary">
              Browse All Categories
            </Button>
          </div>
        </div>
      </section>

      {childrenWithListings.length > 0 && (
        <section aria-labelledby="subcategories-heading">
          <div className="container">
            <h2 id="subcategories-heading" className="visually-hidden">
              {parent.name} Subcategories
            </h2>
            <nav className="directory-browse-links" aria-label="Subcategories">
              {childrenWithListings.map((child) => (
                <Link href={`/businesses/category/${parent.slug}/${child.slug}`} key={child.slug}>
                  {child.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            {parent.name} Businesses
          </h2>
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <BusinessCard business={business} key={business.id} />
              ))}
            </div>
          ) : (
            <p>
              No {parent.name} businesses listed yet.{" "}
              <Link href="/signup">Be the first to add yours.</Link>
            </p>
          )}
        </div>
      </section>

      {relevantCities.length > 0 && (
        <section className="section-alt" aria-labelledby="relevant-cities-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Browse by City</span>
              <h2 id="relevant-cities-heading">{parent.name} by City</h2>
            </div>
            <nav className="directory-browse-links" aria-label="Relevant cities">
              {relevantCities.map((city) => (
                <Link href={`/businesses/city/${city.slug}/${parent.slug}`} key={city.slug}>
                  {parent.name} in {city.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      {businesses.length > 0 && (
        <section className="section-alt" aria-labelledby="other-categories-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Other Categories</span>
              <h2 id="other-categories-heading">Browse Other Categories</h2>
            </div>
            <nav className="directory-browse-links" aria-label="Other categories">
              {otherParents.map((otherParent) => (
                <Link href={`/businesses/category/${otherParent.slug}`} key={otherParent.slug}>
                  {otherParent.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}
    </>
  );
}
