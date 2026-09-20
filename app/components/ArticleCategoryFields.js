"use client";

import { useState } from "react";

// Real parent->child dependent dropdown for the article form — replaces the
// old 9-item hardcoded list (duplicated between new/page.js and edit/page.js)
// that only ever exposed a small slice of the real 183-child blog taxonomy.
// Submits taxonomy SLUGS in "category"/"subcategory", same convention as
// CategorySubcategoryFields.js for businesses — createArticle/updateArticle
// (app/account/articles/actions.js) resolve and validate them against the
// real taxonomy server-side and store the resolved NAME (child's if picked,
// else the parent's) into the single flat `articles.category` column, since
// articles don't have a separate subcategory column — see the note on
// app/blog/category/[parent]/page.js for why that's a real, kept design
// choice, not something this form needs to change.
//
// `parents` is the full two-level taxonomy tree (getAllParents() from
// app/data/blog.js) passed down from the server component that renders
// this, since the tree itself doesn't change per request.
export default function ArticleCategoryFields({ parents, defaultParentSlug, defaultChildSlug }) {
  const [parentSlug, setParentSlug] = useState(defaultParentSlug || "");
  const [childSlug, setChildSlug] = useState(defaultChildSlug || "");

  const selectedParent = parents.find((p) => p.slug === parentSlug);
  const children = selectedParent?.children ?? [];

  function handleParentChange(event) {
    setParentSlug(event.target.value);
    // A subcategory picked under the old parent is no longer valid once
    // the parent changes — reset it instead of silently carrying it over.
    setChildSlug("");
  }

  return (
    <div className="form-row">
      <div className="form-field">
        <label htmlFor="category">Category *</label>
        <select id="category" name="category" value={parentSlug} onChange={handleParentChange} required>
          <option value="" disabled>
            Select a category
          </option>
          {parents.map((parent) => (
            <option key={parent.slug} value={parent.slug}>
              {parent.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="subcategory">Subcategory (optional)</label>
        <select
          id="subcategory"
          name="subcategory"
          value={childSlug}
          onChange={(event) => setChildSlug(event.target.value)}
          disabled={children.length === 0}
        >
          <option value="">No subcategory</option>
          {children.map((child) => (
            <option key={child.slug} value={child.slug}>
              {child.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
