import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Button from "../../components/Button";
import SubmitButton from "../../components/SubmitButton";
import { closeOwnJob, deleteOwnJob } from "../../jobs/actions";
import { JOB_STATUS_LABELS } from "../../data/jobOptions";
import { isAcceptingApplications } from "@/lib/seo/jobListings";

export const metadata = {
  title: "My Jobs Posted",
  robots: { index: false, follow: false },
};

const STATUS_ICONS = {
  pending_review: "🕐",
  published: "✅",
  rejected: "❌",
  expired: "⏳",
  closed: "⏸️",
};

// Server Component — the layout (app/account/layout.js) already guarantees
// a signed-in user before this renders.
export default async function MyJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, slug, title, status, is_verified, is_featured, rejection_reason, application_deadline, expires_at, created_at"
    )
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  const jobIds = (jobs ?? []).map((job) => job.id);
  const { data: applicationRows } = jobIds.length
    ? await supabase.from("job_applications").select("job_id").in("job_id", jobIds)
    : { data: [] };
  const applicationCounts = (applicationRows ?? []).reduce((acc, row) => {
    acc[row.job_id] = (acc[row.job_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <h2>My Jobs Posted</h2>
      <p className="hero-description">Every job you&apos;ve posted, newest first.</p>

      {jobs && jobs.length > 0 ? (
        <ul className="account-article-list">
          {jobs.map((job) => {
            const isLive = job.status === "published";
            const isExpired = job.status === "published" && !isAcceptingApplications(job);
            return (
              <li key={job.id} className="account-article-item">
                {isLive ? <Link href={`/jobs/${job.slug}`}>{job.title}</Link> : <span>{job.title}</span>}
                <span className="account-meta">
                  <span>
                    {new Date(job.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span className="locked-inline-hint">
                    {STATUS_ICONS[job.status] ?? ""} {JOB_STATUS_LABELS[job.status] ?? job.status}
                  </span>
                  {job.is_verified && <span className="locked-inline-hint">✔️ Verified</span>}
                  {job.is_featured && <span className="locked-inline-hint">★ Featured</span>}
                  {isExpired && <span className="locked-inline-hint">Deadline passed</span>}
                </span>
                {job.status === "rejected" && job.rejection_reason && (
                  <p className="form-error">Rejected: {job.rejection_reason}</p>
                )}
                <div className="account-article-actions">
                  <Link href={`/account/jobs/${job.slug}/applications`} className="btn btn-secondary btn-sm">
                    View Applications ({applicationCounts[job.id] ?? 0})
                  </Link>
                  {job.status === "published" && (
                    <form action={closeOwnJob.bind(null, job.id)}>
                      <SubmitButton className="btn btn-secondary btn-sm" pendingLabel="Closing…">
                        Close Job
                      </SubmitButton>
                    </form>
                  )}
                  <form action={deleteOwnJob.bind(null, job.id)}>
                    <SubmitButton className="btn btn-danger btn-sm" pendingLabel="Deleting…">
                      Delete
                    </SubmitButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>You haven&apos;t posted any jobs yet.</p>
      )}

      <Button href="/jobs/post-job" variant="primary">
        Post a New Job
      </Button>
    </>
  );
}
