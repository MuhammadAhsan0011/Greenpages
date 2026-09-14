"use client";

// This MUST be a Client Component — checking the chosen file's type/size/
// pixel dimensions and showing immediate feedback needs an onChange
// handler. The actual upload still happens the normal way: this renders a
// real <input type="file" name={name}> that submits with the rest of the
// surrounding <form>, no fetch/JS needed for that part.

import { useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MIN_WIDTH = 800;
const MIN_HEIGHT = 400;
// Every spot the cover image renders (FeaturedBusinessCard.js) uses
// object-fit: contain, so a too-thin image never gets cropped, just
// letterboxed — this floor exists to reject anything that would look
// cramped or blurry once fit in, not to prevent cropping.
const MIN_ASPECT_RATIO = 1.3;

// Mirrors the server-side check in app/account/actions.js
// (validateCoverImageDimensions) so a bad file gets rejected instantly
// instead of after a round trip.
function readImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export default function CoverImageUploadField({ name, label }) {
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleChange(event) {
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
      setError(`"${file.name}" is ${sizeMb}MB — the limit is 5MB. Please choose a smaller file.`);
      event.target.value = "";
      return;
    }

    setChecking(true);
    const dims = await readImageDimensions(file);
    setChecking(false);

    if (!dims) {
      setError(`"${file.name}" couldn't be read as an image. Please choose a different file.`);
      event.target.value = "";
      return;
    }
    if (dims.width < MIN_WIDTH || dims.height < MIN_HEIGHT) {
      setError(
        `"${file.name}" is ${dims.width}×${dims.height}px — cover images need to be at least ${MIN_WIDTH}×${MIN_HEIGHT}px.`
      );
      event.target.value = "";
      return;
    }
    if (dims.width / dims.height < MIN_ASPECT_RATIO) {
      setError(
        `"${file.name}" is ${dims.width}×${dims.height}px — that's too tall/square and would look cramped. Upload a landscape image (at least ${MIN_ASPECT_RATIO}:1 wide).`
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
      {checking && <p className="editor-hint">Checking image…</p>}
      {selected && <p className="image-upload-selected">Selected: {selected}</p>}
      {error && <p className="form-error image-upload-error">{error}</p>}
      <p className="editor-hint">
        PNG, JPG, WebP, or GIF up to 5MB — landscape, at least {MIN_WIDTH}×{MIN_HEIGHT}px
        ({MIN_ASPECT_RATIO}:1 or wider). 1200×675px (16:9) recommended. Shown on the homepage.
      </p>
    </>
  );
}
