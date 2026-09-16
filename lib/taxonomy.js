// Shared tree-walking helpers for a two-level {parent -> children} taxonomy.
// businessCategories.js and blog.js each build their own tree and bind
// these against it, so the lookup logic itself lives in exactly one place
// instead of being duplicated per taxonomy.
export function createTaxonomyHelpers(tree) {
  function getAllParents() {
    return tree;
  }

  function getAllChildren() {
    return tree.flatMap((parent) =>
      parent.children.map((child) => ({
        ...child,
        parentSlug: parent.slug,
        parentName: parent.name,
      }))
    );
  }

  function getParent(slug) {
    return tree.find((parent) => parent.slug === slug);
  }

  function getChild(parentSlug, childSlug) {
    const parent = getParent(parentSlug);
    return parent?.children.find((child) => child.slug === childSlug);
  }

  // Looks up a slug at either level. Parents are checked first, so a slug
  // that (implausibly) collided between levels would resolve to the parent.
  function findBySlug(slug) {
    const parent = getParent(slug);
    if (parent) return { ...parent, level: "parent" };
    const child = getAllChildren().find((c) => c.slug === slug);
    return child ? { ...child, level: "child" } : undefined;
  }

  function isValidCategorySlug(slug) {
    return Boolean(findBySlug(slug));
  }

  return { getAllParents, getAllChildren, getParent, getChild, findBySlug, isValidCategorySlug };
}
