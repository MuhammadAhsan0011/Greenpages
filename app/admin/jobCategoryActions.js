"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueCategorySlug(supabase, name) {
  const base = slugify(name);
  let candidate = base;
  let attempt = 2;
  while (true) {
    const { data } = await supabase.from("job_categories").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
    attempt += 1;
  }
}

function revalidateJobCategoryPaths() {
  revalidatePath("/admin/job-categories");
  revalidatePath("/jobs");
  revalidatePath("/jobs/post-job");
}

export async function createJobCategory(formData) {
  const supabase = await requireAdmin();

  const name = formData.get("name")?.toString().trim() ?? "";
  const parentId = formData.get("parentId")?.toString().trim() || null;
  const icon = formData.get("icon")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() ?? "0", 10) || 0;

  if (!name) redirect("/admin/job-categories?error=" + encodeURIComponent("Category name is required."));

  const slug = await generateUniqueCategorySlug(supabase, name);

  await supabase.from("job_categories").insert({
    name,
    slug,
    parent_id: parentId,
    icon,
    description,
    sort_order: sortOrder,
  });

  revalidateJobCategoryPaths();
}

export async function updateJobCategory(formData) {
  const supabase = await requireAdmin();

  const categoryId = formData.get("categoryId")?.toString();
  const name = formData.get("name")?.toString().trim() ?? "";
  const icon = formData.get("icon")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const sortOrder = parseInt(formData.get("sortOrder")?.toString() ?? "0", 10) || 0;

  if (!categoryId || !name) return;

  await supabase
    .from("job_categories")
    .update({ name, icon, description, sort_order: sortOrder })
    .eq("id", categoryId);

  revalidateJobCategoryPaths();
}

// Deactivating (not deleting) is the default way to remove a category from
// public view — a discoverable category URL should never just disappear,
// same "deactivate, don't hard-delete" rule already applied to business
// categories (see CLAUDE.md). Real deletion is still available
// (deleteJobCategory) for genuine mistakes.
export async function toggleJobCategoryActive(categoryId, isActive) {
  const supabase = await requireAdmin();

  await supabase.from("job_categories").update({ is_active: isActive }).eq("id", categoryId);

  revalidateJobCategoryPaths();
}

// jobs.category_id has no ON DELETE clause, so the database itself refuses
// to delete a category that any job still points to (foreign key
// violation) — a parent category with children is removable, since those
// cascade, but one with jobs on it isn't until those jobs are recategorized
// or removed. That's the intended backstop, not handled specially here.
export async function deleteJobCategory(categoryId) {
  const supabase = await requireAdmin();

  await supabase.from("job_categories").delete().eq("id", categoryId);

  revalidateJobCategoryPaths();
}
