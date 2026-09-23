import Image from "next/image";
import Link from "next/link";
import NoPhotoPlaceholder from "./NoPhotoPlaceholder";
import VerifiedBadge from "./VerifiedBadge";
import FeaturedBadge from "./FeaturedBadge";
import { employmentTypeLabel, workModeLabel, formatSalary } from "../data/jobOptions";
import { formatRelativeTime } from "@/lib/relativeTime";
import { isAcceptingApplications } from "@/lib/seo/jobListings";

// Server Component — shared job card used by /jobs, category pages, and
// location pages, same "one card, every archive reuses it" pattern as
// BusinessCard.js. Listings include jobs past their application deadline
// (isPublishedJob no longer excludes them — see lib/seo/jobListings.js),
// so every card needs its own Active/Expired badge to tell them apart.
export default function JobCard({ job }) {
  const salary = formatSalary(job);
  const accepting = isAcceptingApplications(job);

  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="job-card-logo">
          {job.company_logo_url ? (
            <Image src={job.company_logo_url} alt={`${job.company_name} logo`} width={56} height={56} />
          ) : (
            <NoPhotoPlaceholder />
          )}
        </div>
        <div className="job-card-badges">
          {job.is_verified && <VerifiedBadge />}
          {job.is_featured && <FeaturedBadge />}
          <span
            className={`application-status-badge ${accepting ? "application-status-positive" : "application-status-negative"}`}
          >
            {accepting ? "Active" : "Expired"}
          </span>
        </div>
      </div>

      <h3 className="job-card-title">
        <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
      </h3>
      <p className="job-card-company">{job.company_name}</p>

      <div className="job-card-meta">
        {job.city && <span>{job.city}, Pakistan</span>}
        <span>{employmentTypeLabel(job.employment_type)}</span>
        <span>{workModeLabel(job.work_mode)}</span>
      </div>

      {salary && <p className="job-card-salary">{salary}</p>}

      {job.skills && (
        <p className="job-card-skills">
          {job.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 4)
            .join(", ")}
        </p>
      )}

      <div className="job-card-bottom">
        <span className="job-card-posted">Posted {formatRelativeTime(job.published_at)}</span>
        <Link href={`/jobs/${job.slug}`} className="btn btn-secondary btn-sm">
          View Job
        </Link>
      </div>
    </article>
  );
}
