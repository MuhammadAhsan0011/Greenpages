import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../../components/Button";
import BusinessCard from "../../../../components/BusinessCard";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import { createPublicClient } from "@/utils/supabase/public";
import { PK_CITIES, getCityBySlug } from "../../../../data/directoryCities";
import { getAllParents, getParent } from "../../../../data/businessCategories";
import { PLAN_RANK } from "../../../../data/plans";
import { filterForCityParent, isPublishedBusiness, matchesCity, matchesParent } from "@/lib/seo/businessListings";
import { getArchiveRobots, INDEXING_THRESHOLD } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// Only pre-renders the city×category combinations that already qualify for
// indexing (>= INDEXING_THRESHOLD) — generating all 5 cities × 20 parents
// (100 combos, most of them empty) up front would make the thin-content
// problem this route exists to fix worse, not better. A combo visited
// directly that wasn't pre-rendered still resolves on demand (Next's
// default dynamicParams) with the empty state and a noindex tag.
export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("businesses").select("category, city, needs_review");
  const rows = data ?? [];

  const params = [];
  for (const city of PK_CITIES) {
    for (const parent of getAllParents()) {
      const count = rows.filter(
        (b) => isPublishedBusiness(b) && matchesCity(b, city.name) && matchesParent(b, parent.name)
      ).length;
      if (count >= INDEXING_THRESHOLD) {
        params.push({ city: city.slug, parent: parent.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }) {
  const { city: citySlug, parent: parentSlug } = await params;
  const city = getCityBySlug(citySlug);
  const parent = getParent(parentSlug);

  if (!city || !parent) {
    return { title: "Not Found" };
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .ilike("city", `%${city.name}%`)
    .eq("category", parent.name);
  const businesses = filterForCityParent(data ?? [], city.name, parent.name);

  const title = `${parent.name} Businesses in ${city.name} | Green Pages`;
  const description =
    `Find verified ${parent.name} businesses in ${city.name}, Pakistan on Green Pages — or list your own business free.`.slice(
      0,
      155
    );

  return {
    title,
    description,
    alternates: {
      canonical: `/businesses/city/${city.slug}/${parent.slug}`,
    },
    robots: getArchiveRobots(businesses.length),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/businesses/city/${city.slug}/${parent.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Server Component — a directory landing page scoped to one city AND one
// parent category at once. Generated only when it qualifies for indexing
// (see generateStaticParams); still resolves for a direct visit otherwise,
// same empty-state pattern as every other archive page here.
export default async function CityCategoryDirectoryPage({ params }) {
  const { city: citySlug, parent: parentSlug } = await params;
  const city = getCityBySlug(citySlug);
  const parent = getParent(parentSlug);

  if (!city || !parent) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .ilike("city", `%${city.name}%`)
    .eq("category", parent.name);

  const businesses = filterForCityParent(data ?? [], city.name, parent.name).sort((a, b) => {
    const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
    if (planDiff !== 0) return planDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const collectionSchema = buildCollectionPageSchema(
    {
      name: `${parent.name} Businesses in ${city.name}`,
      path: `/businesses/city/${city.slug}/${parent.slug}`,
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
              { name: city.name, path: `/businesses/city/${city.slug}` },
              { name: parent.name },
            ]}
          />
          <span className="hero-eyebrow">Business Directory</span>
          <h1>
            {parent.name} Businesses in {city.name}
          </h1>
          <div className="hero-ctas">
            <Button href="/signup" variant="secondary">
              List Your Business Free
            </Button>
            <Button href={`/businesses/city/${city.slug}`} variant="secondary">
              Browse All {city.name} Businesses
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            {parent.name} Businesses in {city.name}
          </h2>
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <BusinessCard business={business} key={business.id} />
              ))}
            </div>
          ) : (
            <p>
              No {parent.name} businesses listed in {city.name} yet.{" "}
              <Link href="/signup">Be the first to add yours.</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
