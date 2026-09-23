import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Button from "../../components/Button";
import JobCard from "../../components/JobCard";
import { isPublishedJob } from "@/lib/seo/jobListings";

export const metadata = {
  title: "Saved Jobs",
  robots: { index: false, follow: false },
};

// Server Component — the layout (app/account/layout.js) already guarantees
// a signed-in user before this renders.
export default async function SavedJobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: savedRows } = await supabase
    .from("saved_jobs")
    .select("id, jobs(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = (savedRows ?? []).map((row) => row.jobs).filter(Boolean).filter(isPublishedJob);

  return (
    <>
      <h2>Saved Jobs</h2>
      <p className="hero-description">Jobs you&apos;ve bookmarked to apply to later.</p>

      {jobs.length > 0 ? (
        <div className="job-list">
          {jobs.map((job) => (
            <JobCard job={job} key={job.id} />
          ))}
        </div>
      ) : (
        <p>
          You haven&apos;t saved any jobs yet. <Link href="/jobs">Browse jobs</Link> to get started.
        </p>
      )}

      <Button href="/jobs" variant="primary">
        Browse More Jobs
      </Button>
    </>
  );
}
