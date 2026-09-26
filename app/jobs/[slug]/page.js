import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/utils/supabase/public";
import { createClient } from "@/utils/supabase/server";
import { isPublishedJob, isAcceptingApplications } from "@/lib/seo/jobListings";
import { buildJobPostingSchema } from "@/lib/seo/jobSchema";
import { SITE_URL } from "@/lib/site";
import { fetchActiveJobCategories, buildJobCategoryTree } from "@/lib/jobCategories";
import { employmentTypeLabel, workModeLabel, experienceLevelLabel, formatSalary } from "../../data/jobOptions";
import { formatRelativeTime } from "@/lib/relativeTime";
import Breadcrumbs from "../../components/Breadcrumbs";
import NoPhotoPlaceholder from "../../components/NoPhotoPlaceholder";
import VerifiedBadge from "../../components/VerifiedBadge";
import FeaturedBadge from "../../components/FeaturedBadge";
import SanitizedArticleBody from "../../components/SanitizedArticleBody";
import SaveJobButton from "../../components/SaveJobButton";
import ShareButton from "../../components/ShareButton";
import JobCard from "../../components/JobCard";

export const revalidate = 60;

async function getJob(slug) {
  const supabase = createPublicClient();
  const { data } = await supabase.from("jobs").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job || !isPublishedJob(job)) {
    return { title: "Job Not Found" };
  }

  const description = job.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title: `${job.title} at ${job.company_name}`,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
  };
}

// Splits a textarea's newline-separated lines into a clean bullet list —
// same convention as how responsibilities/requirements were collected on
// the post-job form (one item per line), not a comma-separated field.
function toLines(text) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function JobDetailPage({ params, searchParams }) {
  const { slug } = await params;
  const search = await searchParams;
  const applied = search?.applied === "1";
  const posted = search?.posted === "1";

  const job = await getJob(slug);
  if (!job || !isPublishedJob(job)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Best-effort — a public visitor has no write access under RLS, so this
  // goes through a security-definer function scoped to just this one
  // increment (see docs/seo/jobs-view-count-migration.sql). Never blocks
  // rendering if it fails.
  await supabase.rpc("increment_job_view", { job_id: job.id });

  const publicClient = createPublicClient();
  const [flatCategories, { data: business }, { data: savedRow }, { data: existingApplication }, { data: relatedRows }] =
    await Promise.all([
      fetchActiveJobCategories(publicClient),
      job.business_id
        ? supabase.from("businesses").select("slug, name, logo_url, category, city").eq("id", job.business_id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from("saved_jobs").select("id").eq("user_id", user.id).eq("job_id", job.id).maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase.from("job_applications").select("id, status").eq("applicant_id", user.id).eq("job_id", job.id).maybeSingle()
        : Promise.resolve({ data: null }),
      publicClient.from("jobs").select("*").eq("category_id", job.category_id).neq("id", job.id).limit(8),
    ]);

  const categoryTree = buildJobCategoryTree(flatCategories);
  let categoryParent = null;
  let categoryChild = null;
  for (const parent of categoryTree) {
    if (parent.id === job.category_id) {
      categoryParent = parent;
      break;
    }
    const child = parent.children.find((c) => c.id === job.category_id);
    if (child) {
      categoryParent = parent;
      categoryChild = child;
      break;
    }
  }

  const relatedJobs = (relatedRows ?? []).filter(isPublishedJob).slice(0, 3);

  const jobSchema = buildJobPostingSchema(job, SITE_URL);
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Jobs", path: "/jobs" },
    ...(categoryParent ? [{ name: categoryParent.name, path: `/jobs/category/${categoryParent.slug}` }] : []),
    { name: job.title },
  ];

  const accepting = isAcceptingApplications(job);
  const salary = formatSalary(job);
  const responsibilities = toLines(job.responsibilities);
  const requirements = toLines(job.requirements);
  const skills = (job.skills ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />

      <section className="listing-header">
        <div className="container">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="listing-header-grid">
            <div className="listing-header-info">
              <div className="listing-header-top">
                <div className="business-hero-logo">
                  {job.company_logo_url ? (
                    <Image src={job.company_logo_url} alt={`${job.company_name} logo`} width={72} height={72} />
                  ) : (
                    <NoPhotoPlaceholder />
                  )}
                </div>
                <div>
                  <h1>{job.title}</h1>
                  <p className="job-card-company">
                    {business ? <Link href={`/businesses/${business.slug}`}>{job.company_name}</Link> : job.company_name}
                  </p>
                </div>
              </div>

              <div className="listing-badges">
                {categoryChild ? (
                  <Link href={`/jobs/category/${categoryParent.slug}/${categoryChild.slug}`} className="category-badge">
                    {categoryChild.name}
                  </Link>
                ) : categoryParent ? (
                  <Link href={`/jobs/category/${categoryParent.slug}`} className="category-badge">
                    {categoryParent.name}
                  </Link>
                ) : null}
                {job.is_verified && <VerifiedBadge />}
                {job.is_featured && <FeaturedBadge />}
                <span
                  className={`application-status-badge ${accepting ? "application-status-positive" : "application-status-negative"}`}
                >
                  {accepting ? "Active" : "Expired"}
                </span>
              </div>

              <div className="job-card-meta">
                {job.city && <span>📍 {job.city}, Pakistan</span>}
                <span>{employmentTypeLabel(job.employment_type)}</span>
                <span>{workModeLabel(job.work_mode)}</span>
                <span>{experienceLevelLabel(job.experience_level)}</span>
                <span>{job.view_count ?? 0} Views</span>
              </div>

              {salary && <p className="job-card-salary">{salary}</p>}

              <p className="job-card-posted">
                Posted {formatRelativeTime(job.published_at)}
                {job.application_deadline && <> · Apply by {new Date(job.application_deadline).toLocaleDateString("en-GB")}</>}
              </p>

              {applied && <p className="form-success">Your application was submitted successfully.</p>}
              {posted && <p className="form-success">Your job is now live on Green Pages.</p>}

              {!accepting && !existingApplication && (
                <p className="form-error">
                  This job is no longer accepting applications — the application deadline has passed.
                </p>
              )}

              <div className="listing-actions">
                {existingApplication ? (
                  <span className="application-status-badge application-status-positive">
                    Applied — {existingApplication.status}
                  </span>
                ) : (
                  accepting && (
                    <>
                      {job.apply_on_greenpages && (
                        <Link href={`/jobs/${job.slug}/apply`} className="btn btn-primary">
                          Apply Now
                        </Link>
                      )}
                      {job.apply_whatsapp && (
                        <a href={job.apply_whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                          Apply via WhatsApp
                        </a>
                      )}
                      {job.apply_email && (
                        <a href={`mailto:${job.apply_email}`} className="btn btn-secondary">
                          Apply via Email
                        </a>
                      )}
                      {job.apply_website_url && (
                        <a href={job.apply_website_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                          Apply on Company Website
                        </a>
                      )}
                    </>
                  )
                )}
                <SaveJobButton jobId={job.id} initialSaved={Boolean(savedRow)} signedIn={Boolean(user)} />
                <ShareButton title={`${job.title} at ${job.company_name}`} />
              </div>
            </div>

            <div className="listing-header-illustration">
              <Image
                src="/images/job-detail-illustration.png"
                alt=""
                fill
                sizes="(max-width: 900px) 0px, 40vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="job-description-heading">
        <div className="container">
          <div className="listing-layout">
            <div className="listing-main">
              <div className="account-card">
                <h2 id="job-description-heading">Job Description</h2>
                <SanitizedArticleBody html={job.description} />
              </div>

              {responsibilities.length > 0 && (
                <div className="account-card">
                  <h2>Responsibilities</h2>
                  <ul className="wizard-tip-list">
                    {responsibilities.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {requirements.length > 0 && (
                <div className="account-card">
                  <h2>Requirements</h2>
                  <ul className="wizard-tip-list">
                    {requirements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {skills.length > 0 && (
                <div className="account-card">
                  <h2>Skills</h2>
                  <p>{skills.join(", ")}</p>
                </div>
              )}

              {job.education && (
                <div className="account-card">
                  <h2>Education</h2>
                  <p>{job.education}</p>
                </div>
              )}
            </div>

            <aside className="wizard-sidebar">
              {business && (
                <div className="wizard-sidebar-card">
                  <h3>About the Company</h3>
                  <div className="job-sidebar-logo">
                    {business.logo_url ? (
                      <Image src={business.logo_url} alt={`${business.name} logo`} width={56} height={56} />
                    ) : (
                      <NoPhotoPlaceholder />
                    )}
                  </div>
                  <p>{business.name}</p>
                  {business.category && <p className="job-card-skills">{business.category}</p>}
                  <Link href={`/businesses/${business.slug}`} className="service-link">
                    View Company Profile →
                  </Link>
                </div>
              )}

              <div className="wizard-sidebar-card">
                <h3>Job Overview</h3>
                <ul className="wizard-tip-list">
                  <li>Employment Type: {employmentTypeLabel(job.employment_type)}</li>
                  <li>Work Mode: {workModeLabel(job.work_mode)}</li>
                  <li>Experience: {experienceLevelLabel(job.experience_level)}</li>
                  {job.city && <li>Location: {job.city}, Pakistan</li>}
                  {salary && <li>Salary: {salary}</li>}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {relatedJobs.length > 0 && (
        <section className="section-alt" aria-labelledby="related-jobs-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Similar Jobs</span>
              <h2 id="related-jobs-heading">You May Also Like</h2>
            </div>
            <div className="job-list">
              {relatedJobs.map((relatedJob) => (
                <JobCard job={relatedJob} key={relatedJob.id} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
