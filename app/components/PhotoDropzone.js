"use client";

// This MUST be a Client Component — it needs drag-and-drop event handlers,
// live preview thumbnails for files the user just picked (before they've
// even submitted the form), and a per-photo remove button, none of which a
// Server Component can do. The actual files still travel to the server
// action through a real <input type="file" multiple>, kept in sync via a
// DataTransfer object so removing a preview also removes it from the
// FileList that gets submitted.

import { useEffect, useRef, useState } from "react";

// Defaults are the business-gallery rules. Other callers (e.g. the product
// form) override them through props — see the PhotoDropzone signature.
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DEFAULT_MIN_WIDTH = 800;
const DEFAULT_MIN_HEIGHT = 600;
// The gallery frame displays at roughly 1.6:1 (landscape) and crops
// anything else to fill it — requiring at least a 4:3-ish shape here means
// a portrait or square photo never gets its edges cut off in the gallery.
const DEFAULT_MIN_ASPECT_RATIO = 1.3;

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

// Phone photos are routinely 3-6MB, so a hard "too big" error would make a
// 1MB cap unusable for most people. Re-encodes as JPEG, shrinking quality
// and then size, until it fits; null if it can't get under the limit.
async function compressToLimit(file, maxBytes) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  const loaded = await new Promise((resolve) => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
  URL.revokeObjectURL(url);
  if (!loaded) return null;

  let scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    // JPEG has no alpha — paint white first so transparent PNGs don't go black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) {
        const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
        return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
      }
    }
    scale *= 0.8;
  }
  return null;
}

export default function PhotoDropzone({
  name,
  existingFieldName,
  existingPhotos = [],
  max = 5,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  minWidth = DEFAULT_MIN_WIDTH,
  minHeight = DEFAULT_MIN_HEIGHT,
  minAspectRatio = DEFAULT_MIN_ASPECT_RATIO,
  autoCompress = false,
  hint,
}) {
  const maxSizeLabel =
    maxSizeBytes % (1024 * 1024) === 0
      ? `${maxSizeBytes / (1024 * 1024)}MB`
      : `${Math.round(maxSizeBytes / 1024)}KB`;
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

    setIsChecking(true);
    for (const original of incoming) {
      let file = original;
      if (!allowedTypes.includes(file.type)) {
        setError(
          `"${file.name}" is a ${file.type || "file"} — only ${allowedTypes
            .map((t) => t.replace("image/", "").toUpperCase())
            .join(", ")} images are accepted.`
        );
        continue;
      }
      if (file.size > maxSizeBytes) {
        const compressed = autoCompress ? await compressToLimit(file, maxSizeBytes) : null;
        if (!compressed) {
          setError(
            `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the limit is ${maxSizeLabel} per photo.`
          );
          continue;
        }
        file = compressed;
      }
      typeAndSizeOk.push(file);
    }

    if (typeAndSizeOk.length === 0) {
      setIsChecking(false);
      return;
    }

    const accepted = [];
    for (const file of typeAndSizeOk) {
      const dims = await readImageDimensions(file);
      if (!dims) {
        setError(`"${file.name}" couldn't be read as an image.`);
        continue;
      }
      if (dims.width < minWidth || dims.height < minHeight) {
        setError(
          `"${file.name}" is ${dims.width}×${dims.height}px — photos need to be at least ${minWidth}×${minHeight}px.`
        );
        continue;
      }
      if (minAspectRatio && dims.width / dims.height < minAspectRatio) {
        setError(
          `"${file.name}" is ${dims.width}×${dims.height}px — that's too tall/square and would get cropped. Upload a landscape photo (at least ${minAspectRatio}:1 wide, e.g. 1000×750px).`
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
          {hint ??
            `Landscape photos only, at least ${minWidth}×${minHeight}px — PNG, JPG, WebP, or GIF, up to ${maxSizeLabel} each — ${max} photos max`}
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
