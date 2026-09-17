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

  // Resolves a raw stored category *name* (not slug) to both its parent and
  // child node, when it has one — a business/article's flat category field
  // can hold either a parent- or child-level name, and detail-page
  // breadcrumbs need both levels, not just the single path
  // getCategoryLinkPath-style helpers return.
  function resolveCategoryNodes(categoryName) {
    const parent = tree.find((p) => p.name === categoryName);
    if (parent) return { parent, child: null };
    for (const p of tree) {
      const child = p.children.find((c) => c.name === categoryName);
      if (child) return { parent: p, child };
    }
    return { parent: null, child: null };
  }

  return {
    getAllParents,
    getAllChildren,
    getParent,
    getChild,
    findBySlug,
    isValidCategorySlug,
    resolveCategoryNodes,
  };
}

// A parent's own name plus every one of its children's names. Used where a
// single flat field (e.g. a blog post's category) can hold either a parent-
// or child-level value, and a parent-level archive page needs to aggregate
// both — not a data-migration concern, just how a 2-level taxonomy rolls up
// over a 1-field model.
export function getNamesUnderParent(parent) {
  return [parent.name, ...parent.children.map((child) => child.name)];
}
