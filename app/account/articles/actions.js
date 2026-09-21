"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FREE_PLAN_ARTICLE_LIMIT } from "./constants";
import { getParent, getChild } from "../../data/blog";
import { PK_CITIES } from "../../data/directoryCities";
import { getArticleLinkLimit, countContentLinks } from "@/lib/seo/articleLinks";

const ARTICLE_MIN_WORDS = 800;
const ARTICLE_MAX_WORDS = 2500;
const SUBMISSION_PLANS = ["free", "featured", "sponsored"];

function countWords(html) {
  const text = (html ?? "").replace(/<[^>]*>/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
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

// The new submission form doesn't collect a separate excerpt (not in the
// mockup's field list) — derived from the sanitized content instead of
// adding a field the design doesn't call for. articles.excerpt is `not
// null`, so this always has to produce something.
function deriveExcerpt(html) {
  const text = (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= 200) return text;
  const truncated = text.slice(0, 200);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : 200)}…`;
}

// The form submits taxonomy SLUGS (see ArticleCategoryFields.js), not free
// text — resolved and validated against the real taxonomy here, never
// trusted as-is, same enforcement point as the business category/subcategory
// fix. Articles have a single flat category *column* (no separate
// subcategory column like businesses — see the note on
// app/blog/category/[parent]/page.js for why), so the resolved child name
// (if a subcategory was picked) or otherwise the parent name is what
// actually gets stored.
function resolveArticleCategory(categorySlug, subcategorySlug) {
  const categoryParent = categorySlug ? getParent(categorySlug) : null;
  if (!categoryParent) return { error: "Please choose a valid category." };

  if (subcategorySlug) {
    const categoryChild = getChild(categorySlug, subcategorySlug);
    if (!categoryChild) {
      return {
        error: "Please choose a valid subcategory for the selected category, or leave it blank.",
      };
    }
    return { category: categoryChild.name };
  }

  return { category: categoryParent.name };
}

// Pasted text (from Word, PDF viewers, some web pages) can carry literal
// non-breaking spaces instead of regular ones — invisible in a plain input,
// but unlike a real space they never let a title wrap, so a long one
// overflows its card instead of breaking onto multiple lines.
function normalizeSpaces(text) {
  return text.replace(/ /g, " ").replace(/ {2,}/g, " ").trim();
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Plain "article-title" when that's free; only falls back to "article-
// title-2", "-3", etc. on an actual collision, so most articles get a
// clean URL instead of an always-on random suffix.
async function generateUniqueArticleSlug(supabase, title) {
  const base = slugify(title);
  let candidate = base;
  let attempt = 2;
  while (true) {
    const { data } = await supabase.from("articles").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

async function getIsPaidPlan(supabase, userId) {
  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("owner_id", userId)
    .maybeSingle();
  return business?.plan === "verified" || business?.plan === "featured";
}

// Called directly from RichTextEditor.js (a Verified/Featured-only
// component) to upload an inline image and get back a public URL. Gated
// server-side against the real plan, not just by which UI can reach it.
// Takes FormData (not a bare File) — that's the reliable, documented way
// to send a file to a Server Action invoked directly from client code.
export async function uploadInlineImage(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in." };
  if (!(await getIsPaidPlan(supabase, user.id))) {
    return { error: "Upgrade to Verified or Premium to add inline images." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }

  const upload = await uploadPublicImage(supabase, file, "article-inline-images", user.id);
  if (upload.error) return { error: upload.error.message };
  return { url: upload.url };
}

export async function createArticle(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  function fail(message) {
    redirect(`/account/articles/new?error=${encodeURIComponent(message)}`);
  }

  // Auto-publish is still a Verified/Premium BUSINESS-plan perk, unchanged
  // from before — submission_plan (Free/Featured/Sponsored article pricing,
  // below) is a separate, additive choice available to every author
  // regardless of business plan; it never changes who needs review.
  const isPaidPlan = await getIsPaidPlan(supabase, user.id);

  // Free plan is capped at FREE_PLAN_ARTICLE_LIMIT articles — enforced here
  // against the real count, not just hidden in the UI. Unrelated to
  // submission_plan below (this is about the business's article quota).
  if (!isPaidPlan) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id);

    if ((count ?? 0) >= FREE_PLAN_ARTICLE_LIMIT) {
      fail(
        `Free plan is limited to ${FREE_PLAN_ARTICLE_LIMIT} articles. Upgrade to Verified or Premium for unlimited articles.`
      );
    }
  }

  // ---- 1. Article Details ----
  const title = normalizeSpaces(formData.get("title")?.toString().trim() ?? "");
  const categorySlug = formData.get("category")?.toString().trim();
  const subcategorySlug = formData.get("subcategory")?.toString().trim();
  const targetCityInput = formData.get("targetCity")?.toString().trim() || "";
  const imageCredit = formData.get("imageCredit")?.toString().trim() || null;
  const rawContent = formData.get("content")?.toString() ?? "";

  // The full rich editor (and its server-side sanitization) is used for
  // every submission now, not just paid business plans — the mockup's form
  // doesn't distinguish a "Free" and "Verified" editing experience the way
  // the old form did, and sanitizeArticleHtml runs unconditionally either
  // way, so this isn't a new XSS surface.
  const contentFormat = "html";
  const content = sanitizeArticleHtml(rawContent);
  const wordCount = countWords(content);

  if (!title) fail("Article title is required.");
  if (content.replace(/<[^>]*>/g, "").trim().length === 0) fail("Article content is required.");
  if (wordCount < ARTICLE_MIN_WORDS) {
    fail(`Article content is too short — ${wordCount} words, minimum is ${ARTICLE_MIN_WORDS}.`);
  }
  if (wordCount > ARTICLE_MAX_WORDS) {
    fail(`Article content is too long — ${wordCount} words, maximum is ${ARTICLE_MAX_WORDS}.`);
  }

  const categoryResult = resolveArticleCategory(categorySlug, subcategorySlug);
  if (categoryResult.error) fail(categoryResult.error);
  const category = categoryResult.category;

  // Optional, but if set it must be a real city — not free text, same
  // reject-don't-coerce rule as category/subcategory above.
  if (targetCityInput && !PK_CITIES.some((c) => c.name === targetCityInput)) {
    fail("Please choose a valid target city, or leave it blank.");
  }
  const targetCity = targetCityInput || null;

  const coverImageFile = formData.get("coverImage");
  if (!(coverImageFile instanceof File) || coverImageFile.size === 0) {
    fail("A featured image is required.");
  }
  const coverUpload = await uploadPublicImage(supabase, coverImageFile, "article-featured-images", user.id);
  if (coverUpload.error) fail(coverUpload.error.message);
  const coverImageUrl = coverUpload.url;

  // ---- 2. Author Information ----
  const authorName = normalizeSpaces(formData.get("authorName")?.toString().trim() ?? "");
  const authorEmail = formData.get("authorEmail")?.toString().trim() ?? "";
  const authorPhone = formData.get("authorPhone")?.toString().trim() || null;
  const companyName = formData.get("companyName")?.toString().trim() || null;
  const authorBio = formData.get("authorBio")?.toString().trim() || null;

  if (!authorName) fail("Author full name is required.");
  if (!authorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    fail("A valid author email is required.");
  }

  let authorPhotoUrl = null;
  const authorPhotoFile = formData.get("authorPhoto");
  if (authorPhotoFile instanceof File && authorPhotoFile.size > 0) {
    const photoUpload = await uploadPublicImage(supabase, authorPhotoFile, "author-photos", user.id);
    if (photoUpload.error) fail(photoUpload.error.message);
    authorPhotoUrl = photoUpload.url;
  }

  // ---- 3. Website / Link Information ----
  const websiteUrl = formData.get("websiteUrl")?.toString().trim() || null;
  const businessName = formData.get("businessName")?.toString().trim() || null;
  const targetUrl = formData.get("targetUrl")?.toString().trim() || null;
  const anchorText = formData.get("anchorText")?.toString().trim() || null;

  if (!isValidUrl(websiteUrl)) fail("Website URL doesn't look valid — include https://.");
  if (!isValidUrl(targetUrl)) fail("Target URL doesn't look valid — include https://.");

  // ---- 4. Choose Publishing Option ----
  const submissionPlan = formData.get("submissionPlan")?.toString().trim() ?? "free";
  if (!SUBMISSION_PLANS.includes(submissionPlan)) fail("Please choose a valid publishing option.");

  const linkLimit = getArticleLinkLimit(submissionPlan);
  const linkCount = countContentLinks(content);
  if (linkCount > linkLimit) {
    fail(
      `Your article has ${linkCount} external link${linkCount === 1 ? "" : "s"} — the ${submissionPlan} plan allows up to ${linkLimit}. Remove some links or choose a plan that allows more.`
    );
  }

  // ---- Declarations — all four are required ----
  const declarations = ["confirmOriginal", "confirmPermission", "agreeGuidelines", "understandNoGuarantee"];
  for (const field of declarations) {
    if (formData.get(field) !== "yes") {
      fail("Please confirm all the required declarations before submitting.");
    }
  }

  const slug = await generateUniqueArticleSlug(supabase, title);
  const excerpt = deriveExcerpt(content);

  // Same auto-publish rule as before this feature existed: Verified/Premium
  // business members' articles still go live immediately; everyone else's
  // goes to pending_review regardless of which submission_plan they picked
  // (Featured/Sponsored only buys faster review + more links + the
  // rel="sponsored" badge, per lib/seo/articleLinks.js — never skips review).
  const status = isPaidPlan ? "published" : "pending_review";
  const paymentStatus = submissionPlan === "free" ? "not_required" : "pending";

  const { error } = await supabase.from("articles").insert({
    author_id: user.id,
    slug,
    title,
    excerpt,
    content,
    content_format: contentFormat,
    category,
    cover_image_url: coverImageUrl,
    image_credit: imageCredit,
    target_city: targetCity,
    author_name: authorName,
    author_email: authorEmail,
    author_phone: authorPhone,
    company_name: companyName,
    author_bio: authorBio,
    author_photo_url: authorPhotoUrl,
    website_url: websiteUrl,
    business_name: businessName,
    target_url: targetUrl,
    anchor_text: anchorText,
    submission_plan: submissionPlan,
    link_count: linkCount,
    status,
    payment_status: paymentStatus,
    published_at: new Date().toISOString(),
    approved: isPaidPlan,
  });

  if (error) fail(error.message);

  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/account/articles");
  revalidatePath("/admin");

  // A pending article isn't public yet — send the author to their article
  // list (which shows their own pending work) instead of the live post
  // URL, which would 404 for everyone until it's approved.
  if (status !== "published") {
    redirect("/account/articles?submitted=1");
  }
  redirect(`/blog/${slug}`);
}

// Editing a published article is a Verified/Featured perk — enforced here
// against the real plan, not just by which UI can reach this action, same
// as every other paid-only field on createArticle above.
export async function updateArticle(slug, formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!article || article.author_id !== user.id) {
    redirect("/account/articles");
  }

  const isPaidPlan = await getIsPaidPlan(supabase, user.id);
  if (!isPaidPlan) {
    redirect("/account/articles");
  }

  const title = normalizeSpaces(formData.get("title")?.toString().trim() ?? "");
  const categorySlug = formData.get("category")?.toString().trim();
  const subcategorySlug = formData.get("subcategory")?.toString().trim();
  const excerpt = formData.get("excerpt")?.toString().trim();
  const rawContent = formData.get("content")?.toString() ?? "";
  const content = sanitizeArticleHtml(rawContent);
  const contentIsEmpty = content.replace(/<[^>]*>/g, "").trim().length === 0;

  if (!title || !excerpt || contentIsEmpty) {
    redirect(
      `/account/articles/${slug}/edit?error=${encodeURIComponent("All fields are required.")}`
    );
  }

  const categoryResult = resolveArticleCategory(categorySlug, subcategorySlug);
  if (categoryResult.error) {
    redirect(`/account/articles/${slug}/edit?error=${encodeURIComponent(categoryResult.error)}`);
  }
  const category = categoryResult.category;

  let coverImageUrl = article.cover_image_url;
  const oldCoverImageUrl = article.cover_image_url;
  let shouldDeleteOldCover = false;

  const coverImageFile = formData.get("coverImage");
  if (coverImageFile instanceof File && coverImageFile.size > 0) {
    const upload = await uploadPublicImage(supabase, coverImageFile, "article-images", user.id);
    if (upload.error) {
      redirect(`/account/articles/${slug}/edit?error=${encodeURIComponent(upload.error.message)}`);
    }
    coverImageUrl = upload.url;
    shouldDeleteOldCover = Boolean(oldCoverImageUrl);
  }

  const tags =
    formData
      .get("tags")
      ?.toString()
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(", ") || null;
  const metaTitle = formData.get("metaTitle")?.toString().trim() || null;
  const metaDescription = formData.get("metaDescription")?.toString().trim() || null;
  const featuredOnHomepage = formData.get("featuredOnHomepage") === "yes";

  let publishedAt = article.published_at;
  const requestedPublishDate = formData.get("publishedAt")?.toString();
  if (requestedPublishDate) {
    const parsed = new Date(requestedPublishDate);
    if (!Number.isNaN(parsed.getTime())) {
      publishedAt = parsed.toISOString();
    }
  }

  const { error } = await supabase
    .from("articles")
    .update({
      title,
      excerpt,
      content,
      // Editing is Verified/Premium-only (isPaidPlan already checked above)
      // and always goes through the rich HTML editor, so the saved content
      // is always real HTML from here on — even if the article was first
      // created on the Free plan (content_format: "markdown" back then).
      content_format: "html",
      category,
      cover_image_url: coverImageUrl,
      tags,
      meta_title: metaTitle,
      meta_description: metaDescription,
      featured_on_homepage: featuredOnHomepage,
      published_at: publishedAt,
    })
    .eq("slug", slug);

  if (error) {
    redirect(`/account/articles/${slug}/edit?error=${encodeURIComponent(error.message)}`);
  }

  // Only delete the old cover file once the update has actually saved, so a
  // failed save never leaves the article with a missing image.
  if (shouldDeleteOldCover) {
    await deletePublicImage(supabase, oldCoverImageUrl);
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/");
  revalidatePath("/account/articles");
  redirect(`/blog/${slug}`);
}

// Removes an article's cover image, both the DB reference and the physical
// file in Storage. Verified/Featured-only, same as updateArticle.
export async function removeArticleCoverImage(slug) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: article } = await supabase
    .from("articles")
    .select("author_id, cover_image_url")
    .eq("slug", slug)
    .maybeSingle();

  if (!article || article.author_id !== user.id) {
    redirect("/account/articles");
  }

  const isPaidPlan = await getIsPaidPlan(supabase, user.id);
  if (!isPaidPlan) {
    redirect("/account/articles");
  }

  if (article.cover_image_url) {
    await supabase
      .from("articles")
      .update({ cover_image_url: null })
      .eq("slug", slug);

    await deletePublicImage(supabase, article.cover_image_url);
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/account/articles");
  redirect(`/account/articles/${slug}/edit`);
}

// Lets an article's own author permanently delete it (and its cover image
// file, if any) — available on every plan, since removing your own content
// isn't a paid feature. Free-plan members use this to stay under the
// FREE_PLAN_ARTICLE_LIMIT.
export async function deleteOwnArticle(articleId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: article } = await supabase
    .from("articles")
    .select("author_id, cover_image_url")
    .eq("id", articleId)
    .maybeSingle();

  if (!article || article.author_id !== user.id) {
    redirect("/account/articles");
  }

  await supabase.from("articles").delete().eq("id", articleId);

  if (article.cover_image_url) {
    await deletePublicImage(supabase, article.cover_image_url);
  }

  revalidatePath("/account/articles");
  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/account/articles");
}
