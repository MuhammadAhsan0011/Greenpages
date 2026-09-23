"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fetchActiveJobCategories, buildJobCategoryTree, findJobCategoryInTree } from "@/lib/jobCategories";
import { EMPLOYMENT_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from "../data/jobOptions";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Pasted text (from Word, PDF viewers, some web pages) can carry literal
// non-breaking spaces instead of regular ones — invisible in a plain
// input, same reasoning as the identical helper in
// app/account/articles/actions.js.
function normalizeSpaces(text) {
  return text.replace(/ /g, " ").replace(/ {2,}/g, " ").trim();
}

// Passed to RichTextEditor.js as its uploadAction for the job description
// field — unlike uploadInlineImage (app/account/articles/actions.js),
// this isn't gated behind a Verified/Featured BUSINESS plan, since job
// posting has no such plan concept and a free-plan user (or one with no
// business at all) is still allowed to post a job.
export async function uploadJobDescriptionImage(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }
  const logoError = validateLogoFile(file);
  if (logoError) return { error: logoError };

  const upload = await uploadPublicImage(supabase, file, "job-description-images", user.id);
  if (upload.error) return { error: upload.error.message };
  return { url: upload.url };
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Plain "job-title" when that's free; only falls back to "job-title-2",
// "-3", etc. on an actual collision, same pattern as article/business slugs.
async function generateUniqueJobSlug(supabase, title) {
  const base = slugify(title);
  let candidate = base;
  let attempt = 2;
  while (true) {
    const { data } = await supabase.from("jobs").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateLogoFile(file) {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return `Company logo: only PNG, JPG, WebP, or GIF images are accepted (that file was ${file.type || "an unsupported type"}).`;
  }
  if (file.size > MAX_LOGO_BYTES) {
    return `Company logo is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the limit is 5MB.`;
  }
  return null;
}

// The form submits taxonomy SLUGS (see JobCategoryFields.js), never
// trusted as-is — resolved and validated against the real, DB-backed
// category tree here, same reject-don't-coerce rule as businesses/articles.
// A bare parent selection (no subcategory) is a valid category_id, per the
// jobs.category_id schema note.
async function resolveJobCategory(supabase, categorySlug, subcategorySlug) {
  const flat = await fetchActiveJobCategories(supabase);
  const tree = buildJobCategoryTree(flat);

  if (subcategorySlug) {
    const { child } = findJobCategoryInTree(tree, subcategorySlug);
    if (!child) {
      return { error: "Please choose a valid subcategory, or leave it blank." };
    }
    return { categoryId: child.id };
  }

  const { parent, child } = findJobCategoryInTree(tree, categorySlug);
  if (child) return { categoryId: child.id };
  if (parent) return { categoryId: parent.id };
  return { error: "Please choose a valid job category." };
}

async function getOwnedBusiness(supabase, userId) {
  const { data } = await supabase
    .from("businesses")
    .select("id, name, logo_url")
    .eq("owner_id", userId)
    .maybeSingle();
  return data;
}

// (prevState, formData) => state — the signature useActionState requires
// (see app/components/JobPostForm.js). A validation failure now RETURNS
// an error instead of redirect()-ing: redirecting to a fresh GET request
// tears down the whole form, wiping out everything the user had typed —
// returning state instead lets useActionState re-render the same form in
// place, so typed fields, the rich-text description, and any selected
// files are still there when the error shows up. Only the final success
// path still redirects (there's nothing left to preserve at that point).
export async function createJob(prevState, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  function fail(message) {
    return { error: message };
  }

  // ---- Job Information ----
  const title = formData.get("title")?.toString().trim() ?? "";
  const companyName = formData.get("companyName")?.toString().trim() ?? "";
  const categorySlug = formData.get("category")?.toString().trim();
  const subcategorySlug = formData.get("subcategory")?.toString().trim();
  const rawDescription = formData.get("description")?.toString() ?? "";
  const responsibilities = formData.get("responsibilities")?.toString().trim() || null;
  const requirements = formData.get("requirements")?.toString().trim() || null;
  const skills = formData.get("skills")?.toString().trim() || null;
  const experienceLevel = formData.get("experienceLevel")?.toString().trim() ?? "";
  const education = formData.get("education")?.toString().trim() || null;
  const employmentType = formData.get("employmentType")?.toString().trim() ?? "";
  const workMode = formData.get("workMode")?.toString().trim() ?? "";

  if (!title) return fail("Job title is required.");
  if (!companyName) return fail("Company / organization name is required.");

  const description = sanitizeArticleHtml(rawDescription);
  if (description.replace(/<[^>]*>/g, "").trim().length === 0) {
    return fail("Job description is required.");
  }

  if (!EMPLOYMENT_TYPES.some((t) => t.value === employmentType)) {
    return fail("Please choose a valid employment type.");
  }
  if (!WORK_MODES.some((m) => m.value === workMode)) {
    return fail("Please choose a valid work mode.");
  }
  if (!EXPERIENCE_LEVELS.some((e) => e.value === experienceLevel)) {
    return fail("Please choose a valid experience level.");
  }

  const categoryResult = await resolveJobCategory(supabase, categorySlug, subcategorySlug);
  if (categoryResult.error) return fail(categoryResult.error);

  // ---- Location ----
  // Free text, not restricted to PK_CITIES — a job can be listed from any
  // Pakistani city, not just the 5 with dedicated SEO archive pages
  // (those stay curated; this field doesn't need to match them, same as
  // businesses.city already being free text with no such restriction).
  const cityInput = normalizeSpaces(formData.get("city")?.toString().trim() ?? "").slice(0, 100) || "";
  const area = formData.get("area")?.toString().trim() || null;
  const address = formData.get("address")?.toString().trim() || null;

  if (workMode !== "remote" && !cityInput) {
    return fail("City is required for on-site or hybrid roles.");
  }
  const city = cityInput || null;

  // ---- Compensation ----
  // Mutually exclusive by radio group: a real range, or "negotiable" (open
  // to discussion, no fixed figures) — see JobCard.js/formatSalary() for
  // how each renders.
  const salaryVisibility = formData.get("salaryVisibility")?.toString().trim() || "range";
  if (!["range", "negotiable"].includes(salaryVisibility)) {
    return fail("Please choose a valid salary visibility option.");
  }
  const salaryNegotiable = salaryVisibility === "negotiable";

  const salaryMinRaw = salaryVisibility === "range" ? formData.get("salaryMin")?.toString().trim() : "";
  const salaryMaxRaw = salaryVisibility === "range" ? formData.get("salaryMax")?.toString().trim() : "";
  const salaryMin = salaryMinRaw ? parseInt(salaryMinRaw, 10) : null;
  const salaryMax = salaryMaxRaw ? parseInt(salaryMaxRaw, 10) : null;

  if (salaryMinRaw && (Number.isNaN(salaryMin) || salaryMin < 0)) return fail("Minimum salary looks invalid.");
  if (salaryMaxRaw && (Number.isNaN(salaryMax) || salaryMax < 0)) return fail("Maximum salary looks invalid.");
  if (salaryMin && salaryMax && salaryMin > salaryMax) {
    return fail("Minimum salary can't be higher than maximum salary.");
  }

  // ---- Application deadline ----
  const deadlineInput = formData.get("applicationDeadline")?.toString().trim() || "";
  let applicationDeadline = null;
  if (deadlineInput) {
    const parsed = new Date(deadlineInput);
    if (Number.isNaN(parsed.getTime())) return fail("Application deadline looks invalid.");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed < today) return fail("Application deadline can't be in the past.");
    applicationDeadline = deadlineInput;
  }

  // ---- Application methods — at least one is required ----
  const applyOnGreenpages = formData.get("applyOnGreenpages") === "yes";
  const applyWhatsapp = formData.get("whatsappUrl")?.toString().trim() || null;
  const applyEmail = formData.get("applyEmail")?.toString().trim() || null;
  const applyWebsiteUrl = formData.get("applyWebsiteUrl")?.toString().trim() || null;

  if (!applyOnGreenpages && !applyWhatsapp && !applyEmail && !applyWebsiteUrl) {
    return fail("Choose at least one way for candidates to apply.");
  }
  if (applyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applyEmail)) {
    return fail("The application email doesn't look valid.");
  }
  if (!isValidUrl(applyWebsiteUrl)) return fail("Application website URL doesn't look valid — include https://.");
  if (applyWhatsapp && !isValidUrl(applyWhatsapp)) return fail("WhatsApp link doesn't look valid.");

  // ---- Optionally link an existing business listing instead of
  // duplicating company info ----
  const ownedBusiness = await getOwnedBusiness(supabase, user.id);
  const linkBusiness = formData.get("linkBusiness") === "yes" && ownedBusiness;
  const businessId = linkBusiness ? ownedBusiness.id : null;

  let companyLogoUrl = linkBusiness ? ownedBusiness.logo_url ?? null : null;
  const logoFile = formData.get("companyLogo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const logoError = validateLogoFile(logoFile);
    if (logoError) return fail(logoError);
    const upload = await uploadPublicImage(supabase, logoFile, "job-logos", user.id);
    if (upload.error) return fail(upload.error.message);
    companyLogoUrl = upload.url;
  }

  const slug = await generateUniqueJobSlug(supabase, title);

  // No 'draft', no admin review gate: jobs publish immediately on submit.
  // Admin still sees every job on /admin/jobs and can delete one if
  // needed, but there's no approve/reject step in front of going live.
  const { error } = await supabase.from("jobs").insert({
    employer_id: user.id,
    business_id: businessId,
    company_name: companyName,
    company_logo_url: companyLogoUrl,
    title,
    slug,
    category_id: categoryResult.categoryId,
    description,
    responsibilities,
    requirements,
    skills,
    experience_level: experienceLevel,
    education,
    employment_type: employmentType,
    work_mode: workMode,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_negotiable: salaryNegotiable,
    city,
    area,
    address,
    application_deadline: applicationDeadline,
    apply_on_greenpages: applyOnGreenpages,
    apply_whatsapp: applyWhatsapp,
    apply_email: applyEmail,
    apply_website_url: applyWebsiteUrl,
    status: "published",
    published_at: new Date().toISOString(),
  });

  if (error) return fail(error.message);

  revalidatePath("/jobs");
  revalidatePath("/account/jobs");
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");

  redirect(`/jobs/${slug}?posted=1`);
}

// Lets an employer close their own job (stop accepting applications)
// without deleting its history — the applications already received stay
// intact and visible to them.
export async function closeOwnJob(jobId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: job } = await supabase.from("jobs").select("employer_id, slug").eq("id", jobId).maybeSingle();
  if (!job || job.employer_id !== user.id) redirect("/account/jobs");

  await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId);

  revalidatePath("/jobs");
  revalidatePath("/account/jobs");
  if (job.slug) revalidatePath(`/jobs/${job.slug}`);
}

// Permanently removes a job the employer posted (and its logo file, if it
// was uploaded specifically for this job rather than linked from a
// business profile). Applications are removed automatically via the
// database's own cascade.
export async function deleteOwnJob(jobId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: job } = await supabase
    .from("jobs")
    .select("employer_id, business_id, company_logo_url")
    .eq("id", jobId)
    .maybeSingle();
  if (!job || job.employer_id !== user.id) redirect("/account/jobs");

  await supabase.from("jobs").delete().eq("id", jobId);

  // Only delete the logo file if it wasn't linked from a business profile
  // (that file belongs to the business listing, not this job posting).
  if (!job.business_id && job.company_logo_url) {
    await deletePublicImage(supabase, job.company_logo_url);
  }

  revalidatePath("/jobs");
  revalidatePath("/account/jobs");
  redirect("/account/jobs");
}

export async function saveJob(jobId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("saved_jobs").upsert(
    { user_id: user.id, job_id: jobId },
    { onConflict: "user_id,job_id", ignoreDuplicates: true }
  );

  revalidatePath("/account/saved-jobs");
}

export async function unsaveJob(jobId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);

  revalidatePath("/account/saved-jobs");
}
