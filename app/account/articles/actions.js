"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage, deletePublicImage } from "@/utils/storage";
import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FREE_PLAN_ARTICLE_LIMIT } from "./constants";

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

  // Verified/Featured-only fields and the rich HTML editor. Re-checked
  // here against the real plan in the database — the form only shows
  // these to eligible members, but a request could still be crafted by
  // hand, so the plan gate has to be enforced server-side, not just by
  // hiding UI.
  const isPaidPlan = await getIsPaidPlan(supabase, user.id);

  // Free plan is capped at FREE_PLAN_ARTICLE_LIMIT articles — enforced here
  // against the real count, not just hidden in the UI.
  if (!isPaidPlan) {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id);

    if ((count ?? 0) >= FREE_PLAN_ARTICLE_LIMIT) {
      redirect(
        `/account/articles/new?error=${encodeURIComponent(
          `Free plan is limited to ${FREE_PLAN_ARTICLE_LIMIT} articles. Upgrade to Verified or Premium for unlimited articles.`
        )}`
      );
    }
  }

  const title = normalizeSpaces(formData.get("title")?.toString().trim() ?? "");
  const category = formData.get("category")?.toString().trim();
  const excerpt = formData.get("excerpt")?.toString().trim();
  const rawContent = formData.get("content")?.toString() ?? "";

  const contentFormat = isPaidPlan ? "html" : "markdown";
  const content = contentFormat === "html" ? sanitizeArticleHtml(rawContent) : rawContent.trim();
  const contentIsEmpty =
    contentFormat === "html"
      ? content.replace(/<[^>]*>/g, "").trim().length === 0
      : content.length === 0;

  if (!title || !category || !excerpt || contentIsEmpty) {
    redirect(
      `/account/articles/new?error=${encodeURIComponent("All fields are required.")}`
    );
  }

  let coverImageUrl = null;
  const coverImageFile = formData.get("coverImage");
  if (coverImageFile instanceof File && coverImageFile.size > 0) {
    const upload = await uploadPublicImage(supabase, coverImageFile, "article-images", user.id);
    if (upload.error) {
      redirect(`/account/articles/new?error=${encodeURIComponent(upload.error.message)}`);
    }
    coverImageUrl = upload.url;
  }

  let tags = null;
  let metaTitle = null;
  let metaDescription = null;
  let featuredOnHomepage = false;
  let publishedAt = new Date().toISOString();

  if (isPaidPlan) {
    tags =
      formData
        .get("tags")
        ?.toString()
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(", ") || null;
    metaTitle = formData.get("metaTitle")?.toString().trim() || null;
    metaDescription = formData.get("metaDescription")?.toString().trim() || null;
    featuredOnHomepage = formData.get("featuredOnHomepage") === "yes";

    const requestedPublishDate = formData.get("publishedAt")?.toString();
    if (requestedPublishDate) {
      const parsed = new Date(requestedPublishDate);
      if (!Number.isNaN(parsed.getTime())) {
        publishedAt = parsed.toISOString();
      }
    }
  }

  const slug = await generateUniqueArticleSlug(supabase, title);

  // Free-plan articles go live only once an admin approves them (see the
  // "Pending Articles" section on /admin); Verified/Featured articles
  // still publish immediately, same as before.
  const { error } = await supabase.from("articles").insert({
    author_id: user.id,
    slug,
    title,
    excerpt,
    content,
    content_format: contentFormat,
    category,
    cover_image_url: coverImageUrl,
    tags,
    meta_title: metaTitle,
    meta_description: metaDescription,
    featured_on_homepage: featuredOnHomepage,
    published_at: publishedAt,
    approved: isPaidPlan,
  });

  if (error) {
    redirect(`/account/articles/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/account/articles");

  // A free-plan article isn't public yet — send the author to their
  // article list (which shows their own pending work) instead of the
  // live post URL, which would 404 for everyone until it's approved.
  if (!isPaidPlan) {
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
  const category = formData.get("category")?.toString().trim();
  const excerpt = formData.get("excerpt")?.toString().trim();
  const rawContent = formData.get("content")?.toString() ?? "";
  const content = sanitizeArticleHtml(rawContent);
  const contentIsEmpty = content.replace(/<[^>]*>/g, "").trim().length === 0;

  if (!title || !category || !excerpt || contentIsEmpty) {
    redirect(
      `/account/articles/${slug}/edit?error=${encodeURIComponent("All fields are required.")}`
    );
  }

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
