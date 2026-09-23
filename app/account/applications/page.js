import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Button from "../../components/Button";
import SubmitButton from "../../components/SubmitButton";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import { withdrawApplication } from "../../jobs/apply-actions";

export const metadata = {
  title: "My Applications",
  robots: { index: false, follow: false },
};

// Server Component — the layout (app/account/layout.js) already guarantees
// a signed-in user before this renders.
export default async function MyApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: applications } = await supabase
    .from("job_applications")
    .select("id, status, applied_at, jobs(slug, title, company_name)")
    .eq("applicant_id", user.id)
    .order("applied_at", { ascending: false });

  return (
    <>
      <h2>My Applications</h2>
      <p className="hero-description">Every job you&apos;ve applied to, newest first.</p>

      {applications && applications.length > 0 ? (
        <ul className="account-article-list">
          {applications.map((application) => (
            <li key={application.id} className="account-article-item">
              {application.jobs ? (
                <Link href={`/jobs/${application.jobs.slug}`}>{application.jobs.title}</Link>
              ) : (
                <span>Job no longer available</span>
              )}
              <span className="account-meta">
                {application.jobs?.company_name && <span>{application.jobs.company_name}</span>}
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
              {application.status !== "withdrawn" && (
                <div className="account-article-actions">
                  <form action={withdrawApplication.bind(null, application.id)}>
                    <SubmitButton className="btn btn-danger btn-sm" pendingLabel="Withdrawing…">
                      Withdraw Application
                    </SubmitButton>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>You haven&apos;t applied to any jobs yet.</p>
      )}

      <Button href="/jobs" variant="primary">
        Browse Jobs
      </Button>
    </>
  );
}
