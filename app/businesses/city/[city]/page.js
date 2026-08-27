import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../components/Button";
import BusinessCard from "../../../components/BusinessCard";
import { createPublicClient } from "@/utils/supabase/public";
import { PK_CITIES, getCityBySlug } from "../../../data/directoryCities";

export const revalidate = 60;

// Pre-renders one page per known Pakistani city at build time.
export async function generateStaticParams() {
  return PK_CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return { title: "City Not Found" };
  }

  return {
    title: `Business Directory in ${city.name}`,
    description:
      `Find verified businesses in ${city.name}, Pakistan on Green Pages — search by category, or list your own business free.`.slice(
        0,
        160
      ),
    alternates: {
      canonical: `/businesses/city/${city.slug}`,
    },
  };
}

const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// Server Component — a directory landing page scoped to one Pakistani city,
// with its own unique intro copy (see data/directoryCities.js) so it reads
// as a real page rather than a templated find-and-replace.
export default async function CityDirectoryPage({ params }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .ilike("city", `%${city.name}%`);

  const businesses = (data ?? []).sort((a, b) => {
    const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
    if (planDiff !== 0) return planDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const otherCities = PK_CITIES.filter((c) => c.slug !== city.slug);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/businesses">Business Directory</Link> / {city.name}
          </p>
          <span className="hero-eyebrow">Business Directory</span>
          <h1>Business Directory in {city.name}</h1>
          <p className="hero-description">{city.intro}</p>
          <div className="hero-ctas">
            <Button href="/signup" variant="secondary">
              List Your Business Free
            </Button>
            <Button href="/businesses" variant="secondary">
              Browse All Cities
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            Businesses in {city.name}
          </h2>
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <BusinessCard business={business} key={business.id} />
              ))}
            </div>
          ) : (
            <p>
              No businesses listed in {city.name} yet.{" "}
              <Link href="/signup">Be the first to add yours.</Link>
            </p>
          )}
        </div>
      </section>

      <section className="section-alt" aria-labelledby="other-cities-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Other Cities</span>
            <h2 id="other-cities-heading">Browse Other Cities</h2>
          </div>
          <nav className="directory-browse-links" aria-label="Other cities">
            {otherCities.map((otherCity) => (
              <Link href={`/businesses/city/${otherCity.slug}`} key={otherCity.slug}>
                {otherCity.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
