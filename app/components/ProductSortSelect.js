"use client";

// Client Component for the same reason as JobSortSelect.js: auto-submitting
// the surrounding form on change needs an onChange handler.

import { PRODUCT_SORT_OPTIONS } from "../data/productOptions";

export default function ProductSortSelect({ defaultValue }) {
  return (
    <select
      id="sort"
      name="sort"
      defaultValue={defaultValue}
      onChange={(event) => event.target.form?.submit()}
    >
      {PRODUCT_SORT_OPTIONS.map((option) => (
        <option value={option.value} key={option.value}>
          Sort: {option.label}
        </option>
      ))}
    </select>
  );
}
