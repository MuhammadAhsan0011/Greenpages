import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../components/Button";
import JobCard from "../../../components/JobCard";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { createPublicClient } from "@/utils/supabase/public";
import { PK_CITIES, getCityBySlug } from "../../../data/directoryCities";
import { filterForCity } from "@/lib/seo/jobListings";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// Pre-renders one page per known Pakistani city at build time — same
// approach as /businesses/city/[city], since PK_CITIES is a small, static
// list (unlike job_categories, which is DB-backed and skips
// generateStaticParams for that reason — see /jobs/category/[slug]).
export async function generateStaticParams() {
  return PK_CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return { title: "City Not Found" };
  }

  const supabase = createPublicClient();
  const { data } = await supabase.from("jobs").select("*").ilike("city", `%${city.name}%`);
  const jobs = filterForCity(data ?? [], city.name);

  const title = `Jobs in ${city.name}, Pakistan | Green Pages`;
  const description = `Browse job openings in ${city.name}, Pakistan on Green Pages — apply directly or via WhatsApp, email, or the employer's website.`.slice(
    0,
    155
  );

  return {
    title,
    description,
    alternates: { canonical: `/jobs/city/${city.slug}` },
    robots: getArchiveRobots(jobs.length),
    openGraph: { title, description, type: "website", url: `${SITE_URL}/jobs/city/${city.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobsCityPage({ params }) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data } = await supabase.from("jobs").select("*").ilike("city", `%${city.name}%`);

  const jobs = filterForCity(data ?? [], city.name).sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    return new Date(b.published_at) - new Date(a.published_at);
  });

  const otherCities = PK_CITIES.filter((c) => c.slug !== city.slug);

  const collectionSchema = buildCollectionPageSchema(
    { name: `Jobs in ${city.name}`, description: city.intro, path: `/jobs/city/${city.slug}` },
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
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Jobs", path: "/jobs" }, { name: city.name }]} />
          <span className="hero-eyebrow">Jobs</span>
          <h1>Jobs in {city.name}, Pakistan</h1>
          <div className="hero-ctas">
            <Button href="/jobs/post-job" variant="secondary">
              Post a Job
            </Button>
            <Button href="/jobs" variant="secondary">
              Browse All Jobs
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            Jobs in {city.name}
          </h2>
          {jobs.length > 0 ? (
            <div className="job-list">
              {jobs.map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
          ) : (
            <p>
              No jobs listed in {city.name} yet.{" "}
              <Link href="/jobs/post-job">Be the first to post one.</Link>
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
              <Link href={`/jobs/city/${otherCity.slug}`} key={otherCity.slug}>
                {otherCity.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
