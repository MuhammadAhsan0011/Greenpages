"use server";

import { createClient } from "@/utils/supabase/server";
import { deletePublicImage } from "@/utils/storage";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PLAN_IDS } from "../data/plans";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  return supabase;
}

// Approves a pending request: copies requested_plan into plan and clears
// the request. businessId/plan are pre-bound to the form action (see
// app/admin/page.js), so the submitted form only needs to identify itself.
export async function approveUpgrade(businessId, plan) {
  const supabase = await requireAdmin();

  await supabase
    .from("businesses")
    .update({ plan, requested_plan: null })
    .eq("id", businessId);

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

// Declines a pending request without changing the current plan.
export async function dismissRequest(businessId) {
  const supabase = await requireAdmin();

  await supabase.from("businesses").update({ requested_plan: null }).eq("id", businessId);

  revalidatePath("/admin");
}

// Manual override — set any business's plan directly, for corrections or
// upgrades arranged outside the normal request flow.
export async function setPlan(formData) {
  const supabase = await requireAdmin();

  const businessId = formData.get("businessId")?.toString();
  const plan = formData.get("plan")?.toString();

  if (!businessId || !PLAN_IDS.includes(plan)) {
    return;
  }

  await supabase
    .from("businesses")
    .update({ plan, requested_plan: null })
    .eq("id", businessId);

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

// Makes a pending review publicly visible.
export async function approveReview(reviewId, businessSlug) {
  const supabase = await requireAdmin();

  await supabase.from("reviews").update({ approved: true }).eq("id", reviewId);

  revalidatePath("/admin");
  revalidatePath("/reviews");
  revalidatePath("/");
  if (businessSlug) {
    revalidatePath(`/businesses/${businessSlug}`);
  }
}

// Deletes a pending review instead of approving it.
export async function dismissReview(reviewId) {
  const supabase = await requireAdmin();

  await supabase.from("reviews").delete().eq("id", reviewId);

  revalidatePath("/admin");
}

// Permanently removes a business listing (and its logo file, if any).
// Reviews for this business are removed automatically via the database's
// own cascade — articles by the same owner are untouched, since those are
// a separate listing from the business profile.
export async function deleteBusiness(businessId) {
  const supabase = await requireAdmin();

  const { data: business } = await supabase
    .from("businesses")
    .select("logo_url")
    .eq("id", businessId)
    .maybeSingle();

  await supabase.from("businesses").delete().eq("id", businessId);

  if (business?.logo_url) {
    await deletePublicImage(supabase, business.logo_url);
  }

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

// Shared by every article-review action below — same revalidate set every
// time, so approve/reject/request-changes/publish/unpublish/feature can't
// drift from each other on which paths they refresh.
function revalidateArticlePaths(slug) {
  revalidatePath("/admin");
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/account/articles");
  if (slug) revalidatePath(`/blog/${slug}`);
}

// Makes a pending free-plan article publicly visible.
export async function approveArticle(articleId) {
  const supabase = await requireAdmin();

  const { data: article } = await supabase
    .from("articles")
    .update({ approved: true, status: "published", reviewed_at: new Date().toISOString() })
    .eq("id", articleId)
    .select("slug")
    .maybeSingle();

  revalidateArticlePaths(article?.slug);
}

// Declines a submission outright, with a reason the author can see on
// /account/articles. Stays unapproved/unpublished.
export async function rejectArticle(formData) {
  const supabase = await requireAdmin();
  const articleId = formData.get("articleId")?.toString();
  const reason = formData.get("reason")?.toString().trim() || null;
  if (!articleId) return;

  const { data: article } = await supabase
    .from("articles")
    .update({
      approved: false,
      status: "rejected",
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", articleId)
    .select("slug")
    .maybeSingle();

  revalidateArticlePaths(article?.slug);
}

// Sends a submission back to the author with a note on what to fix —
// distinct from a flat rejection, the author can resubmit.
export async function requestArticleChanges(formData) {
  const supabase = await requireAdmin();
  const articleId = formData.get("articleId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;
  if (!articleId) return;

  const { data: article } = await supabase
    .from("articles")
    .update({
      approved: false,
      status: "changes_requested",
      admin_notes: note,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", articleId)
    .select("slug")
    .maybeSingle();

  revalidateArticlePaths(article?.slug);
}

// Publishes an already-approved-in-spirit article (or re-publishes one that
// was previously unpublished) — the counterpart to unpublishArticle below.
export async function publishArticle(articleId) {
  const supabase = await requireAdmin();

  const { data: article } = await supabase
    .from("articles")
    .update({ approved: true, status: "published", reviewed_at: new Date().toISOString() })
    .eq("id", articleId)
    .select("slug")
    .maybeSingle();

  revalidateArticlePaths(article?.slug);
}

// Takes a published article back down without deleting it — content and
// submission history stay intact, it just stops being publicly visible.
export async function unpublishArticle(articleId) {
  const supabase = await requireAdmin();

  const { data: article } = await supabase
    .from("articles")
    .update({ approved: false, status: "unpublished" })
    .eq("id", articleId)
    .select("slug")
    .maybeSingle();

  revalidateArticlePaths(article?.slug);
}

// Toggles homepage featuring — independent of submission_plan (a Free-plan
// article can still be manually featured by an admin; Sponsored doesn't
// auto-feature).
export async function toggleFeatureArticle(articleId, featured) {
  const supabase = await requireAdmin();

  const { data: article } = await supabase
    .from("articles")
    .update({ featured_on_homepage: featured })
    .eq("id", articleId)
    .select("slug")
    .maybeSingle();

  revalidateArticlePaths(article?.slug);
}

// Marks a Featured/Sponsored submission's manual payment (Easypaisa/bank
// transfer, confirmed via WhatsApp screenshot — same flow as business plan
// upgrades) as received. Doesn't publish by itself — approve/publish is
// still a separate, deliberate editorial action.
export async function confirmArticlePayment(articleId) {
  const supabase = await requireAdmin();

  await supabase.from("articles").update({ payment_status: "confirmed" }).eq("id", articleId);

  revalidatePath("/admin");
}

// Permanently removes an article (and its cover image file, if any).
export async function deleteArticle(articleId) {
  const supabase = await requireAdmin();

  const { data: article } = await supabase
    .from("articles")
    .select("slug, cover_image_url")
    .eq("id", articleId)
    .maybeSingle();

  await supabase.from("articles").delete().eq("id", articleId);

  if (article?.cover_image_url) {
    await deletePublicImage(supabase, article.cover_image_url);
  }

  revalidateArticlePaths(article?.slug);
}

function revalidateJobPaths(slug) {
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath("/account/jobs");
  if (slug) revalidatePath(`/jobs/${slug}`);
}

// "Verified" = admin has reviewed and vouches for this specific job —
// never conflated with "Featured" (promotional visibility), per the jobs
// spec's explicit rule. Independent of status; a published job can be
// verified or not.
export async function verifyJob(jobId) {
  const supabase = await requireAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs")
    .update({ is_verified: true, verified_at: new Date().toISOString(), verified_by: user?.email ?? null })
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  revalidateJobPaths(job?.slug);
}

export async function unverifyJob(jobId) {
  const supabase = await requireAdmin();

  const { data: job } = await supabase
    .from("jobs")
    .update({ is_verified: false, verified_at: null, verified_by: null })
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  revalidateJobPaths(job?.slug);
}

export async function featureJob(jobId) {
  const supabase = await requireAdmin();

  const { data: job } = await supabase
    .from("jobs")
    .update({ is_featured: true })
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  revalidateJobPaths(job?.slug);
}

export async function unfeatureJob(jobId) {
  const supabase = await requireAdmin();

  const { data: job } = await supabase
    .from("jobs")
    .update({ is_featured: false })
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  revalidateJobPaths(job?.slug);
}

// Admin override of an employer's own closeOwnJob (app/jobs/actions.js) —
// for jobs that need to be pulled down without waiting on the employer.
export async function closeJob(jobId) {
  const supabase = await requireAdmin();

  const { data: job } = await supabase
    .from("jobs")
    .update({ status: "closed" })
    .eq("id", jobId)
    .select("slug")
    .maybeSingle();

  revalidateJobPaths(job?.slug);
}

// Permanently removes a job (and its logo file, if it wasn't linked from a
// business profile). Applications are removed automatically via the
// database's own cascade.
export async function deleteJob(jobId) {
  const supabase = await requireAdmin();

  const { data: job } = await supabase
    .from("jobs")
    .select("slug, business_id, company_logo_url")
    .eq("id", jobId)
    .maybeSingle();

  await supabase.from("jobs").delete().eq("id", jobId);

  if (job && !job.business_id && job.company_logo_url) {
    await deletePublicImage(supabase, job.company_logo_url);
  }

  revalidateJobPaths(job?.slug);
}
