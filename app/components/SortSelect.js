"use client";

// This MUST be a Client Component — auto-submitting the surrounding form
// when the sort option changes needs an onChange handler, which a Server
// Component can't attach (event handlers can't cross the server/client
// boundary as plain props). The <select> itself still posts as normal
// form data on submit, same as everything else on this page.

export default function SortSelect({ defaultValue }) {
  return (
    <select
      id="sort"
      name="sort"
      defaultValue={defaultValue}
      onChange={(event) => event.target.form?.submit()}
    >
      <option value="newest">Sort by: Newest First</option>
      <option value="oldest">Sort by: Oldest First</option>
      <option value="rating">Sort by: Highest Rated</option>
      <option value="name">Sort by: Name (A-Z)</option>
    </select>
  );
}
