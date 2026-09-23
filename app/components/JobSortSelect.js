"use client";

// Client Component for the same reason as SortSelect.js: auto-submitting
// the surrounding form on change needs an onChange handler, which a Server
// Component can't attach.

import { JOB_SORT_OPTIONS } from "../data/jobOptions";

export default function JobSortSelect({ defaultValue }) {
  return (
    <select
      id="sort"
      name="sort"
      defaultValue={defaultValue}
      onChange={(event) => event.target.form?.submit()}
    >
      {JOB_SORT_OPTIONS.map((option) => (
        <option value={option.value} key={option.value}>
          Sort: {option.label}
        </option>
      ))}
    </select>
  );
}
