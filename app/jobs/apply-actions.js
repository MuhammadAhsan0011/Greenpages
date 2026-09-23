"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage } from "@/utils/storage";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isPublishedJob, isAcceptingApplications } from "@/lib/seo/jobListings";

const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function isValidUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateCvFile(file) {
  if (!ALLOWED_CV_TYPES.includes(file.type)) {
    return `CV/resume: only PDF, DOC, or DOCX files are accepted (that file was ${file.type || "an unsupported type"}).`;
  }
  if (file.size > MAX_CV_BYTES) {
    return `CV/resume is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the limit is 5MB.`;
  }
  return null;
}

// The internal application form — an alternative to the employer's
// WhatsApp/email/website options, never the only way to apply unless the
// employer disabled those (apply_on_greenpages is just one of up to four
// independent methods, see app/jobs/actions.js).
export async function applyToJob(jobSlug, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/jobs/${jobSlug}/apply`)}`);
  }

  function fail(message) {
    redirect(`/jobs/${jobSlug}/apply?error=${encodeURIComponent(message)}`);
  }

  const { data: job } = await supabase.from("jobs").select("*").eq("slug", jobSlug).maybeSingle();
  if (!job || !isPublishedJob(job) || !job.apply_on_greenpages) {
    fail("This job is no longer accepting applications through Green Pages.");
  }
  if (!isAcceptingApplications(job)) {
    fail("This job's application deadline has passed — it's no longer accepting applications.");
  }

  const { data: existing } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", job.id)
    .eq("applicant_id", user.id)
    .maybeSingle();
  if (existing) {
    fail("You've already applied to this job.");
  }

  const fullName = formData.get("fullName")?.toString().trim() ?? "";
  const email = formData.get("email")?.toString().trim() ?? "";
  const phone = formData.get("phone")?.toString().trim() || null;
  const coverLetter = formData.get("coverLetter")?.toString().trim() || null;
  const relevantExperience = formData.get("relevantExperience")?.toString().trim() || null;
  const portfolioUrl = formData.get("portfolioUrl")?.toString().trim() || null;
  const linkedinUrl = formData.get("linkedinUrl")?.toString().trim() || null;

  if (!fullName) fail("Full name is required.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("A valid email is required.");
  if (!isValidUrl(portfolioUrl)) fail("Portfolio URL doesn't look valid — include https://.");
  if (!isValidUrl(linkedinUrl)) fail("LinkedIn URL doesn't look valid — include https://.");

  let cvUrl = null;
  const cvFile = formData.get("cv");
  if (cvFile instanceof File && cvFile.size > 0) {
    const cvError = validateCvFile(cvFile);
    if (cvError) fail(cvError);
    const upload = await uploadPublicImage(supabase, cvFile, "job-application-cvs", user.id);
    if (upload.error) fail(upload.error.message);
    cvUrl = upload.url;
  }

  const { error } = await supabase.from("job_applications").insert({
    job_id: job.id,
    applicant_id: user.id,
    full_name: fullName,
    email,
    phone,
    cv_url: cvUrl,
    cover_letter: coverLetter,
    relevant_experience: relevantExperience,
    portfolio_url: portfolioUrl,
    linkedin_url: linkedinUrl,
  });

  if (error) fail(error.message);

  revalidatePath("/account/applications");
  revalidatePath(`/account/jobs/${jobSlug}/applications`);

  redirect(`/jobs/${jobSlug}?applied=1`);
}

// Lets an applicant withdraw their own application — the row stays (so the
// employer can still see it was withdrawn) rather than being deleted.
export async function withdrawApplication(applicationId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: application } = await supabase
    .from("job_applications")
    .select("applicant_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application || application.applicant_id !== user.id) redirect("/account/applications");

  await supabase
    .from("job_applications")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  revalidatePath("/account/applications");
}

// Employer-side status update for an application to one of THEIR jobs —
// enforced by the "Employers can update status of applications to their
// jobs" RLS policy (a join against jobs.employer_id), not just this check.
// Takes formData (applicationId/jobSlug/status as hidden+select fields),
// same "read everything from the form" shape as app/admin/actions.js's
// rejectArticle, since the status value can't be known until submit time.
export async function updateApplicationStatus(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const applicationId = formData.get("applicationId")?.toString();
  const jobSlug = formData.get("jobSlug")?.toString();
  const status = formData.get("status")?.toString();

  const ALLOWED_STATUSES = ["applied", "under_review", "shortlisted", "interview", "selected", "rejected"];
  if (!applicationId || !ALLOWED_STATUSES.includes(status)) return;

  await supabase
    .from("job_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (jobSlug) revalidatePath(`/account/jobs/${jobSlug}/applications`);
}
