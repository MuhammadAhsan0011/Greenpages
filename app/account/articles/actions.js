"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadPublicImage } from "@/utils/storage";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createArticle(formData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title")?.toString().trim();
  const category = formData.get("category")?.toString().trim();
  const excerpt = formData.get("excerpt")?.toString().trim();
  const content = formData.get("content")?.toString().trim();

  if (!title || !category || !excerpt || !content) {
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

  // Verified/Featured-only fields. Re-checked here against the real plan
  // in the database — the form only shows these fields to eligible
  // members, but a request could still be crafted by hand, so the plan
  // gate has to be enforced server-side, not just by hiding UI.
  const { data: business } = await supabase
    .from("businesses")
    .select("plan")
    .eq("owner_id", user.id)
    .maybeSingle();
  const isPaidPlan = business?.plan === "verified" || business?.plan === "featured";

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

  // Appends a short unique suffix so two articles with the same title never
  // collide, without needing an extra lookup query first.
  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("articles").insert({
    author_id: user.id,
    slug,
    title,
    excerpt,
    content,
    category,
    cover_image_url: coverImageUrl,
    tags,
    meta_title: metaTitle,
    meta_description: metaDescription,
    featured_on_homepage: featuredOnHomepage,
    published_at: publishedAt,
  });

  if (error) {
    redirect(`/account/articles/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/account");
  redirect(`/blog/${slug}`);
}
