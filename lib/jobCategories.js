// Job categories are DB-backed (job_categories table) instead of a static
// JS file like businessCategories.js/blog.js — the one deliberate
// deviation from the rest of the site's taxonomy pattern, so admins can
// add/edit/delete/reorder/deactivate without a code deploy. The tree-
// shaping/lookup logic below mirrors lib/taxonomy.js's shape (parent ->
// children, findBySlug-equivalent) but operates on already-fetched rows so
// it stays pure and unit-testable — same reasoning as lib/seo/blogContent.js
// being dependency-free on purpose.

// ---- Pure (no DB) ----

export function buildJobCategoryTree(flatCategories) {
  const parents = flatCategories
    .filter((c) => !c.parent_id)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  return parents.map((parent) => ({
    ...parent,
    children: flatCategories
      .filter((c) => c.parent_id === parent.id)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}

// Looks up a slug at either level in an already-built tree.
export function findJobCategoryInTree(tree, slug) {
  for (const parent of tree) {
    if (parent.slug === slug) return { parent, child: null };
    const child = parent.children.find((c) => c.slug === slug);
    if (child) return { parent, child };
  }
  return { parent: null, child: null };
}

// A parent's own id plus every child's id — the set lib/seo/jobListings.js's
// matchesCategoryIds uses so a parent category page rolls up its
// children's jobs, same "parent aggregates children" rule already used for
// businesses/blog.
export function getJobCategoryIdsUnderParent(parent) {
  return [parent.id, ...parent.children.map((child) => child.id)];
}

// ---- DB-backed (caller supplies the Supabase client, so a public
// storefront page can use the anon client while an admin page that also
// needs inactive rows can pass its own) ----

export async function fetchActiveJobCategories(supabase) {
  const { data } = await supabase
    .from("job_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function fetchAllJobCategoriesAdmin(supabase) {
  const { data } = await supabase
    .from("job_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}
