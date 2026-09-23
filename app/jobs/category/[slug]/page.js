import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../components/Button";
import JobCard from "../../../components/JobCard";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { createPublicClient } from "@/utils/supabase/public";
import {
  fetchActiveJobCategories,
  buildJobCategoryTree,
  findJobCategoryInTree,
  getJobCategoryIdsUnderParent,
} from "@/lib/jobCategories";
import { filterForCategory } from "@/lib/seo/jobListings";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";
import { PK_CITIES } from "../../../data/directoryCities";

export const revalidate = 60;

// No generateStaticParams here — job_categories is DB-backed (admin CRUD),
// not a static file like businessCategories.js/blog.js, so pre-generating
// every slug at build time would require a build-time DB dependency. Same
// practical choice already made for the DB-backed article/job detail pages
// in this codebase: rendered on demand and cached via `revalidate` instead.

async function loadCategoryContext(slug) {
  const supabase = createPublicClient();
  const flat = await fetchActiveJobCategories(supabase);
  const tree = buildJobCategoryTree(flat);
  const { parent, child } = findJobCategoryInTree(tree, slug);
  return { supabase, tree, parent, child };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { parent, child } = await loadCategoryContext(slug);
  const node = child || parent;

  if (!node) {
    return { title: "Category Not Found" };
  }

  const supabase = createPublicClient();
  const categoryIds = child ? [child.id] : getJobCategoryIdsUnderParent(parent);
  const { data } = await supabase.from("jobs").select("*").in("category_id", categoryIds);
  const jobs = filterForCategory(data ?? [], categoryIds);

  const title = node.meta_title || `${node.name} Jobs in Pakistan | Green Pages`;
  const description =
    node.meta_description ||
    `Browse ${node.name} job openings across Pakistan on Green Pages. Apply directly or via WhatsApp, email, or the employer's website.`.slice(
      0,
      155
    );

  return {
    title,
    description,
    alternates: { canonical: `/jobs/category/${node.slug}` },
    robots: getArchiveRobots(jobs.length),
    openGraph: { title, description, type: "website", url: `${SITE_URL}/jobs/category/${node.slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobCategoryPage({ params }) {
  const { slug } = await params;
  const { supabase, tree, parent, child } = await loadCategoryContext(slug);
  const node = child || parent;

  if (!node) {
    notFound();
  }

  const categoryIds = child ? [child.id] : getJobCategoryIdsUnderParent(parent);
  const { data } = await supabase.from("jobs").select("*").in("category_id", categoryIds);
  const jobs = filterForCategory(data ?? [], categoryIds).sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    return new Date(b.published_at) - new Date(a.published_at);
  });

  const childrenWithListings = !child
    ? parent.children.filter((c) => jobs.some((job) => job.category_id === c.id))
    : [];

  const otherParents = tree.filter((p) => p.slug !== (parent?.slug ?? node.slug));

  // Cross-links into the gated city×category pages — without a link
  // somewhere in server-rendered HTML, those routes would be orphaned
  // (technically resolvable, but never discoverable by a crawler).
  const relevantCities = PK_CITIES.filter((city) =>
    jobs.some((job) => job.city && job.city.toLowerCase().includes(city.name.toLowerCase()))
  );

  const collectionSchema = buildCollectionPageSchema(
    {
      name: `${node.name} Jobs in Pakistan`,
      description: node.description || undefined,
      path: `/jobs/category/${node.slug}`,
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
              { name: "Home", path: "/" },
              { name: "Jobs", path: "/jobs" },
              ...(child ? [{ name: parent.name, path: `/jobs/category/${parent.slug}` }] : []),
              { name: node.name },
            ]}
          />
          <span className="hero-eyebrow">Jobs</span>
          <h1>{node.name} Jobs in Pakistan</h1>
          {node.description && <p className="hero-description">{node.description}</p>}
          <div className="hero-ctas">
            <Button href="/jobs/post-job" variant="secondary">
              Post a Job
            </Button>
            <Button href="/jobs" variant="secondary">
              Browse All Categories
            </Button>
          </div>
        </div>
      </section>

      {childrenWithListings.length > 0 && (
        <section aria-labelledby="subcategories-heading">
          <div className="container">
            <h2 id="subcategories-heading" className="visually-hidden">
              {node.name} Subcategories
            </h2>
            <nav className="directory-browse-links" aria-label="Subcategories">
              {childrenWithListings.map((c) => (
                <Link href={`/jobs/category/${c.slug}`} key={c.slug}>
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            {node.name} Jobs
          </h2>
          {jobs.length > 0 ? (
            <div className="job-list">
              {jobs.map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
          ) : (
            <p>
              No {node.name} jobs listed yet.{" "}
              <Link href="/jobs/post-job">Be the first to post one.</Link>
            </p>
          )}
        </div>
      </section>

      {relevantCities.length > 0 && (
        <section className="section-alt" aria-labelledby="relevant-cities-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Browse by City</span>
              <h2 id="relevant-cities-heading">{node.name} Jobs by City</h2>
            </div>
            <nav className="directory-browse-links" aria-label="Relevant cities">
              {relevantCities.map((city) => (
                <Link href={`/jobs/city/${city.slug}/${node.slug}`} key={city.slug}>
                  {node.name} Jobs in {city.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="section-alt" aria-labelledby="other-categories-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Other Categories</span>
              <h2 id="other-categories-heading">Browse Other Categories</h2>
            </div>
            <nav className="directory-browse-links" aria-label="Other categories">
              {otherParents.map((otherParent) => (
                <Link href={`/jobs/category/${otherParent.slug}`} key={otherParent.slug}>
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
