"use client";

// This MUST be a Client Component — auto-submitting the surrounding form
// when the page size changes needs an onChange handler, which a Server
// Component can't attach. Same pattern as SortSelect.js on /businesses.

export default function AdminPageSizeSelect({ name, defaultValue, options }) {
  return (
    <select
      id={name}
      name={name}
      defaultValue={defaultValue}
      onChange={(event) => event.target.form?.submit()}
    >
      {options.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  );
}
