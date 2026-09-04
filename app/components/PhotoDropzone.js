"use client";

// This MUST be a Client Component — it needs drag-and-drop event handlers,
// live preview thumbnails for files the user just picked (before they've
// even submitted the form), and a per-photo remove button, none of which a
// Server Component can do. The actual files still travel to the server
// action through a real <input type="file" multiple>, kept in sync via a
// DataTransfer object so removing a preview also removes it from the
// FileList that gets submitted.

import { useEffect, useRef, useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
// The gallery frame displays at roughly 1.6:1 (landscape) and crops
// anything else to fill it — requiring at least a 4:3-ish shape here means
// a portrait or square photo never gets its edges cut off in the gallery.
const MIN_ASPECT_RATIO = 1.3;

// Reads a file's real pixel dimensions in the browser before we accept it —
// mirrors the same check the server re-runs with sharp, so a bad file never
// even makes it into the preview grid.
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

export default function PhotoDropzone({ name, existingFieldName, existingPhotos = [], max = 5 }) {
  const [kept, setKept] = useState(existingPhotos);
  const [newFiles, setNewFiles] = useState([]); // [{ id, file, previewUrl }]
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const inputRef = useRef(null);

  const total = kept.length + newFiles.length;

  // Revoke object URLs when a preview is removed or the component unmounts,
  // so we don't leak memory for a form the user sits on for a while.
  useEffect(() => {
    return () => {
      newFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncInputFiles(files) {
    const dataTransfer = new DataTransfer();
    files.forEach((f) => dataTransfer.items.add(f.file));
    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files;
    }
  }

  async function addFiles(fileList) {
    setError("");
    const incoming = Array.from(fileList);
    const typeAndSizeOk = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is a ${file.type || "file"} — only PNG, JPG, WebP, or GIF images are accepted.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the limit is 5MB per photo.`);
        continue;
      }
      typeAndSizeOk.push(file);
    }

    if (typeAndSizeOk.length === 0) return;

    setIsChecking(true);
    const accepted = [];
    for (const file of typeAndSizeOk) {
      const dims = await readImageDimensions(file);
      if (!dims) {
        setError(`"${file.name}" couldn't be read as an image.`);
        continue;
      }
      if (dims.width < MIN_WIDTH || dims.height < MIN_HEIGHT) {
        setError(
          `"${file.name}" is ${dims.width}×${dims.height}px — photos need to be at least ${MIN_WIDTH}×${MIN_HEIGHT}px.`
        );
        continue;
      }
      if (dims.width / dims.height < MIN_ASPECT_RATIO) {
        setError(
          `"${file.name}" is ${dims.width}×${dims.height}px — that's too tall/square and would get cropped. Upload a landscape photo (at least ${MIN_ASPECT_RATIO}:1 wide, e.g. 1000×750px).`
        );
        continue;
      }
      accepted.push(file);
    }
    setIsChecking(false);

    if (accepted.length === 0) return;

    const roomLeft = max - total;
    if (roomLeft <= 0) {
      setError(`You can only have ${max} photos — remove one first to add another.`);
      return;
    }

    const toAdd = accepted.slice(0, roomLeft);
    if (accepted.length > toAdd.length) {
      setError(`Only ${max} photos are allowed — added ${toAdd.length} of the ${accepted.length} you selected.`);
    }

    setNewFiles((prev) => {
      const next = [
        ...prev,
        ...toAdd.map((file) => ({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
      syncInputFiles(next);
      return next;
    });
  }

  function removeNewFile(id) {
    setNewFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((f) => f.id !== id);
      syncInputFiles(next);
      return next;
    });
  }

  function removeExisting(url) {
    setKept((prev) => prev.filter((u) => u !== url));
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files?.length) {
      addFiles(event.dataTransfer.files);
    }
  }

  return (
    <div className="photo-dropzone-wrap">
      <input type="hidden" name={existingFieldName} value={kept.join(",")} />
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        multiple
        className="visually-hidden"
        onChange={(event) => event.target.files && addFiles(event.target.files)}
      />

      <div
        className={`photo-dropzone${isDragOver ? " is-drag-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
      >
        <span className="photo-dropzone-icon" aria-hidden="true">
          🖼️
        </span>
        <p>
          <strong>{isChecking ? "Checking photo…" : "Click to browse"}</strong>
          {!isChecking && " or drag photos here"}
        </p>
        <p className="photo-dropzone-hint">
          Landscape photos only, at least {MIN_WIDTH}×{MIN_HEIGHT}px — PNG, JPG, WebP, or GIF, up to 5MB each — {max} photos max
        </p>
      </div>

      {error && <p className="form-error">{error}</p>}

      {total > 0 && (
        <div className="photo-dropzone-grid">
          {kept.map((url) => (
            <div className="photo-dropzone-thumb" key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" />
              <button
                type="button"
                className="photo-dropzone-remove"
                onClick={(event) => {
                  event.stopPropagation();
                  removeExisting(url);
                }}
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
          {newFiles.map((f) => (
            <div className="photo-dropzone-thumb" key={f.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.previewUrl} alt="" />
              <button
                type="button"
                className="photo-dropzone-remove"
                onClick={(event) => {
                  event.stopPropagation();
                  removeNewFile(f.id);
                }}
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="photo-dropzone-count">
        {total} / {max} photos
      </p>
    </div>
  );
}
