import { notFound } from "next/navigation";
import Link from "next/link";
import Button from "../../../../components/Button";
import JobCard from "../../../../components/JobCard";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import { createPublicClient } from "@/utils/supabase/public";
import { PK_CITIES, getCityBySlug } from "../../../../data/directoryCities";
import {
  fetchActiveJobCategories,
  buildJobCategoryTree,
  findJobCategoryInTree,
  getJobCategoryIdsUnderParent,
} from "@/lib/jobCategories";
import { filterForCityCategory } from "@/lib/seo/jobListings";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// No generateStaticParams — job_categories is DB-backed, same reasoning as
// /jobs/category/[slug]. Combined with 5 cities this would also mean a
// build-time query per city×category combination; on-demand rendering with
// `revalidate` covers it without that build-time DB dependency.

async function loadContext(citySlug, categorySlug) {
  const city = getCityBySlug(citySlug);
  const supabase = createPublicClient();
  const flat = await fetchActiveJobCategories(supabase);
  const tree = buildJobCategoryTree(flat);
  const { parent, child } = findJobCategoryInTree(tree, categorySlug);
  return { supabase, city, parent, child };
}

export async function generateMetadata({ params }) {
  const { city: citySlug, category: categorySlug } = await params;
  const { supabase, city, parent, child } = await loadContext(citySlug, categorySlug);
  const node = child || parent;

  if (!city || !node) {
    return { title: "Not Found" };
  }

  const categoryIds = child ? [child.id] : getJobCategoryIdsUnderParent(parent);
  const { data } = await supabase.from("jobs").select("*").ilike("city", `%${city.name}%`).in("category_id", categoryIds);
  const jobs = filterForCityCategory(data ?? [], city.name, categoryIds);

  const title = `${node.name} Jobs in ${city.name} | Green Pages`;
  const description = `Find ${node.name} job openings in ${city.name}, Pakistan on Green Pages.`.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: `/jobs/city/${city.slug}/${node.slug}` },
    robots: getArchiveRobots(jobs.length),
    openGraph: { title, description, type: "website", url: `${SITE_URL}/jobs/city/${city.slug}/${node.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobsCityCategoryPage({ params }) {
  const { city: citySlug, category: categorySlug } = await params;
  const { supabase, city, parent, child } = await loadContext(citySlug, categorySlug);
  const node = child || parent;

  if (!city || !node) {
    notFound();
  }

  const categoryIds = child ? [child.id] : getJobCategoryIdsUnderParent(parent);
  const { data } = await supabase.from("jobs").select("*").ilike("city", `%${city.name}%`).in("category_id", categoryIds);

  const jobs = filterForCityCategory(data ?? [], city.name, categoryIds).sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    return new Date(b.published_at) - new Date(a.published_at);
  });

  const collectionSchema = buildCollectionPageSchema(
    { name: `${node.name} Jobs in ${city.name}`, path: `/jobs/city/${city.slug}/${node.slug}` },
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
              { name: "Home", path: "/" },
              { name: "Jobs", path: "/jobs" },
              { name: city.name, path: `/jobs/city/${city.slug}` },
              { name: node.name },
            ]}
          />
          <span className="hero-eyebrow">Jobs</span>
          <h1>
            {node.name} Jobs in {city.name}
          </h1>
          <div className="hero-ctas">
            <Button href="/jobs/post-job" variant="secondary">
              Post a Job
            </Button>
            <Button href={`/jobs/city/${city.slug}`} variant="secondary">
              Browse All {city.name} Jobs
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            {node.name} Jobs in {city.name}
          </h2>
          {jobs.length > 0 ? (
            <div className="job-list">
              {jobs.map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
          ) : (
            <p>
              No {node.name} jobs listed in {city.name} yet.{" "}
              <Link href="/jobs/post-job">Be the first to post one.</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
