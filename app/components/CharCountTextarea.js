"use client";

// This MUST be a Client Component — the live "N / max characters" counter
// needs to re-render on every keystroke. The textarea still submits
// normally as part of the surrounding <form>; only the counter display
// needs JavaScript.

import { useState } from "react";

export default function CharCountTextarea({
  id,
  name,
  defaultValue = "",
  maxLength,
  rows = 4,
  required = false,
  placeholder,
}) {
  const [length, setLength] = useState(defaultValue.length);

  return (
    <>
      <textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={(event) => setLength(event.target.value.length)}
      />
      <p className="editor-hint char-count-hint">
        {length} / {maxLength} characters
      </p>
    </>
  );
}
