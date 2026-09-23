import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { updateApplicationStatus } from "../../../../jobs/apply-actions";
import ApplicationStatusBadge from "../../../../components/ApplicationStatusBadge";

export const metadata = {
  title: "Job Applications",
  robots: { index: false, follow: false },
};

const STATUS_OPTIONS = ["applied", "under_review", "shortlisted", "interview", "selected", "rejected"];

// Server Component — the layout (app/account/layout.js) already guarantees
// a signed-in user; ownership of the job itself is checked below (also
// enforced by the "Employers can read applications to their jobs" RLS
// policy, which is the real gate — this redirect is just a friendlier UX
// than an empty/blocked query).
export default async function JobApplicationsPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: job } = await supabase.from("jobs").select("id, slug, title, employer_id").eq("slug", slug).maybeSingle();
  if (!job) notFound();
  if (job.employer_id !== user.id) redirect("/account/jobs");

  const { data: applications } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", job.id)
    .order("applied_at", { ascending: false });

  return (
    <>
      <Link href="/account/jobs" className="back-to-dashboard-link">
        ← Back to My Jobs
      </Link>
      <h2>Applications for {job.title}</h2>
      <p className="hero-description">{applications?.length ?? 0} applications received.</p>

      {applications && applications.length > 0 ? (
        <ul className="account-article-list">
          {applications.map((application) => (
            <li key={application.id} className="account-article-item">
              <span>{application.full_name}</span>
              <span className="account-meta">
                <span>{application.email}</span>
                {application.phone && <span>{application.phone}</span>}
                <span>
                  Applied{" "}
                  {new Date(application.applied_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <ApplicationStatusBadge status={application.status} />
              </span>

              {application.cover_letter && <p>{application.cover_letter}</p>}
              {application.relevant_experience && (
                <p className="editor-hint">Experience: {application.relevant_experience}</p>
              )}

              <div className="account-article-actions">
                {application.cv_url && (
                  <a href={application.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    View CV
                  </a>
                )}
                {application.portfolio_url && (
                  <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    Portfolio
                  </a>
                )}
                {application.linkedin_url && (
                  <a href={application.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    LinkedIn
                  </a>
                )}
                {application.status !== "withdrawn" && (
                  <form action={updateApplicationStatus} className="job-sort-form">
                    <input type="hidden" name="applicationId" value={application.id} />
                    <input type="hidden" name="jobSlug" value={slug} />
                    <select name="status" defaultValue={application.status}>
                      {STATUS_OPTIONS.map((status) => (
                        <option value={status} key={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-secondary btn-sm">
                      Update Status
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No applications received yet.</p>
      )}
    </>
  );
}
