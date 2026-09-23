import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isAcceptingApplications } from "@/lib/seo/jobListings";
import SubmitButton from "../../components/SubmitButton";
import { verifyJob, unverifyJob, featureJob, unfeatureJob, closeJob, deleteJob } from "../actions";

export const metadata = {
  title: "Admin — Jobs",
  robots: { index: false, follow: false },
};

// No review queue: jobs publish immediately on submit (see
// app/jobs/actions.js), so there's no Pending/Rejected split here — every
// job lands straight in Published. Admin's role is oversight (Verify/
// Feature) and removal (Close/Delete), not a gate in front of going live.
//
// Lists every matching row per section rather than adding a full
// pagination system (see AdminPaginationBar in app/admin/page.js) — the
// same scope call app/admin/seo/page.js already makes for its own tables.
function JobRow({ job, children }) {
  return (
    <tr>
      <td>{job.title}</td>
      <td>{job.company_name}</td>
      <td>{job.city ?? "Remote"}</td>
      <td>
        {new Date(job.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </td>
      <td className="admin-table-actions">{children}</td>
    </tr>
  );
}

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const { data: jobs } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
  const allJobs = jobs ?? [];

  // "Expired" here means published but past its own deadline — the job
  // page itself stays live (see lib/seo/jobListings.js), this table split
  // is just for admin triage.
  const isExpired = (job) => job.status === "published" && !isAcceptingApplications(job);

  const publishedJobs = allJobs.filter((j) => j.status === "published" && !isExpired(j));
  const expiredJobs = allJobs.filter(isExpired);
  const closedJobs = allJobs.filter((j) => j.status === "closed");

  return (
    <section aria-labelledby="admin-jobs-heading">
      <div className="container">
        <h1 id="admin-jobs-heading">Jobs</h1>
        <p className="hero-description">{allJobs.length} jobs total.</p>

        <div className="account-card">
          <h2>Published Jobs ({publishedJobs.length})</h2>
          {publishedJobs.length === 0 ? (
            <p>No published jobs.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Company</th>
                    <th scope="col">City</th>
                    <th scope="col">Posted</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {publishedJobs.map((job) => (
                    <JobRow job={job} key={job.id}>
                      {job.is_verified ? (
                        <form action={unverifyJob.bind(null, job.id)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
                            Unverify
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={verifyJob.bind(null, job.id)}>
                          <SubmitButton className="btn btn-primary admin-btn-sm" pendingLabel="Saving…">
                            Verify
                          </SubmitButton>
                        </form>
                      )}
                      {job.is_featured ? (
                        <form action={unfeatureJob.bind(null, job.id)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
                            Unfeature
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={featureJob.bind(null, job.id)}>
                          <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Saving…">
                            Feature
                          </SubmitButton>
                        </form>
                      )}
                      <form action={closeJob.bind(null, job.id)}>
                        <SubmitButton className="btn btn-secondary admin-btn-sm" pendingLabel="Closing…">
                          Close
                        </SubmitButton>
                      </form>
                      <form action={deleteJob.bind(null, job.id)}>
                        <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Deleting…">
                          Delete
                        </SubmitButton>
                      </form>
                    </JobRow>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="account-card">
          <h2>Expired Jobs ({expiredJobs.length})</h2>
          {expiredJobs.length === 0 ? (
            <p>No expired jobs.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Company</th>
                    <th scope="col">City</th>
                    <th scope="col">Posted</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredJobs.map((job) => (
                    <JobRow job={job} key={job.id}>
                      <form action={deleteJob.bind(null, job.id)}>
                        <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Deleting…">
                          Delete
                        </SubmitButton>
                      </form>
                    </JobRow>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="account-card">
          <h2>Closed Jobs ({closedJobs.length})</h2>
          {closedJobs.length === 0 ? (
            <p>No closed jobs.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Company</th>
                    <th scope="col">City</th>
                    <th scope="col">Posted</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {closedJobs.map((job) => (
                    <JobRow job={job} key={job.id}>
                      <form action={deleteJob.bind(null, job.id)}>
                        <SubmitButton className="btn btn-danger admin-btn-sm" pendingLabel="Deleting…">
                          Delete
                        </SubmitButton>
                      </form>
                    </JobRow>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
