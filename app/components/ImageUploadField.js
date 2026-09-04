"use client";

// This MUST be a Client Component — checking the chosen file's type/size
// and showing immediate feedback needs an onChange handler. The actual
// upload still happens the normal way: this renders a real
// <input type="file" name={name}> that submits with the rest of the
// surrounding <form>, no fetch/JS needed for that part.

import { useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export default function ImageUploadField({
  name,
  label,
  hint = "PNG, JPG, WebP, or GIF up to 5MB",
}) {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  function handleChange(event) {
    const file = event.target.files?.[0];
    setError("");
    setSelected(null);

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        `"${file.name}" is a ${file.type || "file"} — only PNG, JPG, WebP, or GIF images are accepted. Please choose a different file.`
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(
        `"${file.name}" is ${sizeMb}MB — the limit is 5MB. Please choose a smaller file.`
      );
      event.target.value = "";
      return;
    }

    setSelected(file.name);
  }

  return (
    <>
      <label htmlFor={name} className="image-upload-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="file"
        accept="image/*"
        className="visually-hidden"
        onChange={handleChange}
      />
      {selected && <p className="image-upload-selected">Selected: {selected}</p>}
      {error && <p className="form-error image-upload-error">{error}</p>}
      <p className="editor-hint">{hint}</p>
    </>
  );
}
