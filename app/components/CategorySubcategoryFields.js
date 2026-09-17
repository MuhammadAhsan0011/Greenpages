"use client";

import { useState } from "react";

// Real parent->child dependent dropdown for the business listing form —
// replaces the old free-text-backed subcategory input. Submits taxonomy
// SLUGS (not names) in the same "category"/"subcategory" field names the
// server action already reads, which validates them against the real
// taxonomy (app/account/actions.js) — this component only constrains what
// a normal browser interaction can submit, it isn't itself the validation.
//
// `parents` is the full two-level taxonomy tree (getAllParents() from
// app/data/businessCategories.js) passed down from the server component
// that renders this, since the tree itself doesn't change per request.
export default function CategorySubcategoryFields({ parents, defaultParentSlug, defaultChildSlug }) {
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
        <label htmlFor="category">Business Category *</label>
        <select id="category" name="category" value={parentSlug} onChange={handleParentChange} required>
          <option value="" disabled>
            Select primary category
          </option>
          {parents.map((parent) => (
            <option key={parent.slug} value={parent.slug}>
              {parent.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="subcategory">Sub Category (optional)</label>
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
