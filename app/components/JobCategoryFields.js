"use client";

import { useState } from "react";

// Real parent->child dependent dropdown for the job posting form — same
// shape as ArticleCategoryFields.js, adapted for the DB-backed job category
// tree (lib/jobCategories.js's buildJobCategoryTree) instead of a static JS
// taxonomy file. Submits taxonomy SLUGS in "category"/"subcategory";
// app/jobs/actions.js resolves and validates them server-side against the
// real table and stores the resolved category_id (child's if picked, else
// the parent's — a bare parent selection is valid, per the schema note).
//
// `categoryTree` is the already-fetched/shaped tree passed down from the
// server component that renders this, since it doesn't change per request.
export default function JobCategoryFields({ categoryTree, defaultParentSlug, defaultChildSlug }) {
  const [parentSlug, setParentSlug] = useState(defaultParentSlug || "");
  const [childSlug, setChildSlug] = useState(defaultChildSlug || "");

  const selectedParent = categoryTree.find((p) => p.slug === parentSlug);
  const children = selectedParent?.children ?? [];

  function handleParentChange(event) {
    setParentSlug(event.target.value);
    setChildSlug("");
  }

  return (
    <div className="form-row">
      <div className="form-field">
        <label htmlFor="category">Job Category *</label>
        <select id="category" name="category" value={parentSlug} onChange={handleParentChange} required>
          <option value="" disabled>
            Select a category
          </option>
          {categoryTree.map((parent) => (
            <option key={parent.slug} value={parent.slug}>
              {parent.icon ? `${parent.icon} ` : ""}
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
