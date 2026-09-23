import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createPublicClient } from "@/utils/supabase/public";
import { fetchActiveJobCategories, buildJobCategoryTree } from "@/lib/jobCategories";
import JobPostForm from "../../components/JobPostForm";

export const metadata = {
  title: "Post a Job",
  robots: { index: false, follow: false },
};

// Server Component — fetches the data the form needs (category tree,
// the user's own business, for the optional link/prefill), then hands off
// to JobPostForm (a Client Component) for the actual form + submission,
// since useActionState-driven error handling needs to run in the browser
// — see JobPostForm.js for why. Jobs publish immediately on submit — no
// admin review gate — admin can still see and delete any job afterward
// from /admin/jobs.
export default async function PostJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/jobs/post-job");
  }

  const publicClient = createPublicClient();
  const [flatCategories, { data: business }] = await Promise.all([
    fetchActiveJobCategories(publicClient),
    supabase.from("businesses").select("id, name, logo_url").eq("owner_id", user.id).maybeSingle(),
  ]);
  const categoryTree = buildJobCategoryTree(flatCategories);

  return (
    <section aria-labelledby="post-job-heading">
      <div className="container">
        <Link href="/jobs" className="back-to-dashboard-link">
          ← Back to Jobs
        </Link>
        <h1 id="post-job-heading">Post a Job</h1>
        <p className="hero-description">
          Reach job seekers across Pakistan. Your listing goes live as soon
          as you submit it.
        </p>

        <JobPostForm categoryTree={categoryTree} business={business} />
      </div>
    </section>
  );
}
