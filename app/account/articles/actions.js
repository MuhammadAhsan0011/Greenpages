"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getParent, getChild } from "../../data/blog";
import { PK_CITIES } from "../../data/directoryCities";
import { getArticleLinkLimit, countContentLinks } from "@/lib/seo/articleLinks";
import { getPublisherSubmissionLimit, publisherPlanToSubmissionPlan } from "../../data/plans";

const ARTICLE_MIN_WORDS = 800;
const ARTICLE_MAX_WORDS = 2500;

function countWords(html) {
  const text = (html ?? "").replace(/<[^>]*>/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
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
  return text.replace(/ /g, " ").replace(/ {2,}/g, " ").trim();
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
// clean URL instead of an always-on random suffix. `excludeId` is passed
// when re-slugging a row that already exists (e.g. a draft being
// submitted) so it doesn't collide against its own current slug.
async function generateUniqueArticleSlug(supabase, title, excludeId = null) {
  const base = slugify(title);
  let candidate = base;
  let attempt = 2;
  while (true) {
    let query = supabase.from("articles").select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

// The author identity (name/email/phone/company/bio/photo) and the
// Publisher Plan (which drives submission_plan + the submission cadence
// cap) all come from the signed-in user's business profile and account now
// — never re-typed per article. A business row is required: every author
// in this system is a business-account owner (see app/data/plans.js's
// Publisher Plan note), so `author_bio`/`publisher_plan`/etc. all live on
// that one row.
async function getAuthorContext(supabase, user) {
  const [{ data: profile }, { data: business }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("businesses")
      .select(
        "id, plan, publisher_plan, name, website, author_bio, author_photo_url, author_phone"
      )
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  return { profile, business };
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

  const { profile, business } = await getAuthorContext(supabase, user);
  if (!business) {
    fail("Create your business profile first, then come back to write an article.");
  }

  // Auto-publish is still a Verified/Premium BUSINESS-plan perk, unchanged
  // from before — the Publisher Plan below is a separate, additive concept
  // (how OFTEN you may submit) that never changes who needs review.
  const isPaidPlan = business.plan === "verified" || business.plan === "featured";
  const publisherPlan = business.publisher_plan ?? "basic";

  // Continuing a saved draft into a real submission updates that same row
  // instead of inserting a second one — verified against this user before
  // any of it is trusted, same ownership pattern as updateArticle below.
  const draftId = formData.get("draftId")?.toString().trim() || null;
  let existingDraft = null;
  if (draftId) {
    const { data: draftRow } = await supabase
      .from("articles")
      .select("id, author_id, status, cover_image_url")
      .eq("id", draftId)
      .maybeSingle();
    if (draftRow && draftRow.author_id === user.id && draftRow.status === "draft") {
      existingDraft = draftRow;
    }
  }

  // Submission cadence cap — how often this Publisher Plan tier may submit
  // a real article (see PUBLISHER_SUBMISSION_LIMITS in app/data/plans.js).
  // A rolling window from "now", not a calendar day/week. Drafts never
  // count (`.neq("status", "draft")`) — only real submissions do, and a
  // draft being promoted into one here still only consumes one slot.
  const limit = getPublisherSubmissionLimit(publisherPlan);
  const windowStart = new Date(Date.now() - limit.windowDays * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .neq("status", "draft")
    .gte("created_at", windowStart);

  if ((recentCount ?? 0) >= limit.maxArticles) {
    fail(
      `Your Publisher Plan allows ${limit.maxArticles} article${limit.maxArticles === 1 ? "" : "s"} every ${limit.windowLabel} — you've reached that limit. Upgrade your Publisher Plan on the Pricing page to submit more often, or try again later.`
    );
  }

  // ---- Article Details ----
  const title = normalizeSpaces(formData.get("title")?.toString().trim() ?? "");
  const categorySlug = formData.get("category")?.toString().trim();
  const subcategorySlug = formData.get("subcategory")?.toString().trim();
  const targetCityInput = formData.get("targetCity")?.toString().trim() || "";
  const imageCredit = formData.get("imageCredit")?.toString().trim() || null;
  const rawContent = formData.get("content")?.toString() ?? "";

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

  // A draft continuing into a real submission may already have a cover
  // image from when it was saved — only re-uploading replaces it; leaving
  // the picker empty isn't treated as "no image" the way a brand-new
  // submission is.
  const coverImageFile = formData.get("coverImage");
  let coverImageUrl = existingDraft?.cover_image_url ?? null;
  if (coverImageFile instanceof File && coverImageFile.size > 0) {
    const coverUpload = await uploadPublicImage(supabase, coverImageFile, "article-featured-images", user.id);
    if (coverUpload.error) fail(coverUpload.error.message);
    coverImageUrl = coverUpload.url;
  } else if (!coverImageUrl) {
    fail("A featured image is required.");
  }

  // ---- Author identity — from the one-time author profile, not the form ----
  const authorName = profile?.full_name ?? "";
  const authorEmail = user.email ?? "";
  const authorPhone = business.author_phone ?? null;
  const companyName = business.name ?? null;
  const authorBio = business.author_bio ?? null;
  const authorPhotoUrl = business.author_photo_url ?? null;
  const websiteUrl = business.website ?? null;

  // ---- Publishing option — derived from the Publisher Plan, not chosen/paid per article ----
  const submissionPlan = publisherPlanToSubmissionPlan(publisherPlan);

  const linkLimit = getArticleLinkLimit(submissionPlan);
  const linkCount = countContentLinks(content);
  if (linkCount > linkLimit) {
    fail(
      `Your article has ${linkCount} external link${linkCount === 1 ? "" : "s"} — your Publisher Plan allows up to ${linkLimit}. Remove some links or upgrade your Publisher Plan for a higher limit.`
    );
  }

  // ---- Declarations — all four are required ----
  const declarations = ["confirmOriginal", "confirmPermission", "agreeGuidelines", "understandNoGuarantee"];
  for (const field of declarations) {
    if (formData.get(field) !== "yes") {
      fail("Please confirm all the required declarations before submitting.");
    }
  }

  const slug = existingDraft
    ? await generateUniqueArticleSlug(supabase, title, existingDraft.id)
    : await generateUniqueArticleSlug(supabase, title);
  const excerpt = deriveExcerpt(content);

  // Same auto-publish rule as before this feature existed: Verified/Premium
  // business members' articles still go live immediately; everyone else's
  // goes to pending_review regardless of Publisher Plan tier (a higher tier
  // only buys submission frequency + more links + the rel="sponsored"
  // badge, per lib/seo/articleLinks.js — never skips review).
  const status = isPaidPlan ? "published" : "pending_review";

  const articleFields = {
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
    submission_plan: submissionPlan,
    link_count: linkCount,
    status,
    // Billing moved to the annual Publisher Plan (businesses.publisher_plan,
    // confirmed the same way as a business plan upgrade) — an individual
    // article never carries its own payment anymore.
    payment_status: "not_required",
    published_at: new Date().toISOString(),
    approved: isPaidPlan,
  };

  // A submission that started life as a draft updates that same row (so it
  // doesn't leave a duplicate draft row behind); everything else inserts new.
  const { error } = existingDraft
    ? await supabase.from("articles").update(articleFields).eq("id", existingDraft.id)
    : await supabase.from("articles").insert({ ...articleFields, author_id: user.id });

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

// Saves work-in-progress without any of createArticle's publication gates —
// no minimum word count, no declarations, no article-link limit, and no
// submission-cadence check (a draft isn't a submission yet). Only title +
// category are required (category because articles.category is a NOT NULL
// column; everything else can genuinely be filled in later).
//
// Called from the same <form> as createArticle via a second submit button's
// formAction (see app/account/articles/new/page.js), with formNoValidate so
// the browser doesn't block it on fields this action doesn't require.
export async function saveArticleDraft(formData) {
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

  const { profile, business } = await getAuthorContext(supabase, user);
  if (!business) {
    fail("Create your business profile first, then come back to write an article.");
  }

  // Re-saving an in-progress draft updates that same row — ownership and
  // status are re-checked server-side, never trusted from the hidden field
  // alone, same pattern as updateArticle/deleteOwnArticle below.
  const draftId = formData.get("draftId")?.toString().trim() || null;
  let existingDraft = null;
  if (draftId) {
    const { data: draftRow } = await supabase
      .from("articles")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();
    if (!draftRow || draftRow.author_id !== user.id || draftRow.status !== "draft") {
      fail("That draft could not be found.");
    }
    existingDraft = draftRow;
  }

  const title = normalizeSpaces(formData.get("title")?.toString().trim() ?? "");
  if (!title) fail("Give your draft a title before saving.");

  const categorySlug = formData.get("category")?.toString().trim();
  const subcategorySlug = formData.get("subcategory")?.toString().trim();
  const categoryResult = resolveArticleCategory(categorySlug, subcategorySlug);
  if (categoryResult.error) fail(categoryResult.error);
  const category = categoryResult.category;

  const targetCityInput = formData.get("targetCity")?.toString().trim() || "";
  const targetCity = targetCityInput && PK_CITIES.some((c) => c.name === targetCityInput) ? targetCityInput : null;
  const imageCredit = formData.get("imageCredit")?.toString().trim() || null;
  const rawContent = formData.get("content")?.toString() ?? "";
  const content = sanitizeArticleHtml(rawContent);

  // A new cover image replaces the old one; leaving the picker empty keeps
  // whatever the draft already had (unlike createArticle, a draft can be
  // saved with no image at all).
  let coverImageUrl = existingDraft?.cover_image_url ?? null;
  const coverImageFile = formData.get("coverImage");
  if (coverImageFile instanceof File && coverImageFile.size > 0) {
    const coverUpload = await uploadPublicImage(supabase, coverImageFile, "article-featured-images", user.id);
    if (coverUpload.error) fail(coverUpload.error.message);
    coverImageUrl = coverUpload.url;
  }

  const publisherPlan = business.publisher_plan ?? "basic";
  const excerpt = deriveExcerpt(content);
  const linkCount = countContentLinks(content);

  const draftFields = {
    title,
    excerpt,
    content,
    content_format: "html",
    category,
    cover_image_url: coverImageUrl,
    image_credit: imageCredit,
    target_city: targetCity,
    author_name: profile?.full_name ?? "",
    author_email: user.email ?? "",
    author_phone: business.author_phone ?? null,
    company_name: business.name ?? null,
    author_bio: business.author_bio ?? null,
    author_photo_url: business.author_photo_url ?? null,
    website_url: business.website ?? null,
    submission_plan: publisherPlanToSubmissionPlan(publisherPlan),
    link_count: linkCount,
    status: "draft",
    payment_status: "not_required",
    approved: false,
  };

  let savedId = existingDraft?.id;
  if (existingDraft) {
    const { error } = await supabase.from("articles").update(draftFields).eq("id", existingDraft.id);
    if (error) fail(error.message);
  } else {
    const slug = await generateUniqueArticleSlug(supabase, title);
    const { data: inserted, error } = await supabase
      .from("articles")
      .insert({ ...draftFields, author_id: user.id, slug, published_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) fail(error.message);
    savedId = inserted.id;
  }

  revalidatePath("/account/articles");
  redirect(`/account/articles/new?draftId=${savedId}&savedDraft=1`);
}

// One-time author profile: bio, photo, and the phone/WhatsApp authors are
// contacted on — stored on the signed-in user's business row and reused on
// every article from here on (see getAuthorContext above), instead of
// being re-typed per submission. Available on every Publisher Plan tier,
// including Basic.
export async function updateAuthorProfile(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  function fail(message) {
    redirect(`/account/articles/author-profile?error=${encodeURIComponent(message)}`);
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, author_photo_url")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    fail("Create your business profile first, then come back to set up your author profile.");
  }

  const authorBio = formData.get("authorBio")?.toString().trim() || null;
  const authorPhone = formData.get("authorPhone")?.toString().trim() || null;

  let authorPhotoUrl = business.author_photo_url ?? null;
  let oldPhotoUrl = null;
  const photoFile = formData.get("authorPhoto");
  if (photoFile instanceof File && photoFile.size > 0) {
    const upload = await uploadPublicImage(supabase, photoFile, "author-photos", user.id);
    if (upload.error) fail(upload.error.message);
    oldPhotoUrl = business.author_photo_url ?? null;
    authorPhotoUrl = upload.url;
  } else if (formData.get("removePhoto") === "yes" && business.author_photo_url) {
    oldPhotoUrl = business.author_photo_url;
    authorPhotoUrl = null;
  }

  const { error } = await supabase
    .from("businesses")
    .update({ author_bio: authorBio, author_phone: authorPhone, author_photo_url: authorPhotoUrl })
    .eq("id", business.id);

  if (error) fail(error.message);

  if (oldPhotoUrl) {
    await deletePublicImage(supabase, oldPhotoUrl);
  }

  revalidatePath("/account/articles");
  revalidatePath("/account/articles/author-profile");
  revalidatePath("/account/articles/new");
  redirect("/account/articles/author-profile?saved=1");
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
// isn't a paid feature.
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
