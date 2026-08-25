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
  });

  if (error) {
    redirect(`/account/articles/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/blog");
  revalidatePath("/account");
  redirect(`/blog/${slug}`);
}
