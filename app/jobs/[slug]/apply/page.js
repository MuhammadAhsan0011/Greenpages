import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createPublicClient } from "@/utils/supabase/public";
import { createClient } from "@/utils/supabase/server";
import { isPublishedJob, isAcceptingApplications } from "@/lib/seo/jobListings";
import { applyToJob } from "../../apply-actions";
import SubmitButton from "../../../components/SubmitButton";
import SmartTextarea from "../../../components/SmartTextarea";

export const metadata = {
  title: "Apply for a Job",
  robots: { index: false, follow: false },
};

export default async function JobApplyPage({ params, searchParams }) {
  const { slug } = await params;
  const search = await searchParams;
  const error = search?.error;

  const publicClient = createPublicClient();
  const { data: job } = await publicClient.from("jobs").select("*").eq("slug", slug).maybeSingle();

  if (!job || !isPublishedJob(job) || !job.apply_on_greenpages) {
    notFound();
  }
  // The job page itself stays live/visible after the deadline passes (see
  // lib/seo/jobListings.js) — but applying is a real gate, not just
  // cosmetic, so a direct link to this URL after expiry bounces back to
  // the job page instead of rendering a form that would just fail on
  // submit.
  if (!isAcceptingApplications(job)) {
    redirect(`/jobs/${slug}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/jobs/${slug}/apply`)}`);
  }

  const [{ data: profile }, { data: existingApplication }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("job_applications").select("id").eq("job_id", job.id).eq("applicant_id", user.id).maybeSingle(),
  ]);

  if (existingApplication) {
    redirect(`/jobs/${slug}`);
  }

  const applyToThisJob = applyToJob.bind(null, slug);

  return (
    <section aria-labelledby="apply-heading">
      <div className="container">
        <div className="dashboard-form-wrap">
          <Link href={`/jobs/${slug}`} className="back-to-dashboard-link">
            ← Back to Job
          </Link>
          <h1 id="apply-heading">Apply for {job.title}</h1>
          <p className="hero-description">at {job.company_name}</p>

          {error && <p className="form-error">{error}</p>}

          <form action={applyToThisJob} encType="multipart/form-data">
            <div className="account-card">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input id="fullName" name="fullName" type="text" defaultValue={profile?.full_name ?? ""} required />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email *</label>
                  <input id="email" name="email" type="email" defaultValue={user.email ?? ""} required />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" placeholder="+92 3XX XXXXXXX" />
              </div>

              <div className="form-field">
                <span className="form-field-label-standalone">CV / Resume</span>
                <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx" />
                <p className="editor-hint">PDF, DOC, or DOCX (Max 5MB)</p>
              </div>

              <div className="form-field">
                <label htmlFor="coverLetter">Cover Letter</label>
                <SmartTextarea id="coverLetter" name="coverLetter" rows={5} placeholder="Tell the employer why you're a good fit." />
              </div>

              <div className="form-field">
                <label htmlFor="relevantExperience">Relevant Experience</label>
                <SmartTextarea id="relevantExperience" name="relevantExperience" rows={3} placeholder="Briefly summarize relevant experience." />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="portfolioUrl">Portfolio URL</label>
                  <input id="portfolioUrl" name="portfolioUrl" type="url" placeholder="https://yourportfolio.com" />
                </div>
                <div className="form-field">
                  <label htmlFor="linkedinUrl">LinkedIn URL</label>
                  <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://linkedin.com/in/you" />
                </div>
              </div>
            </div>

            <SubmitButton className="btn btn-primary" pendingLabel="Submitting…">
              Submit Application
            </SubmitButton>
          </form>
        </div>
      </div>
    </section>
  );
}
