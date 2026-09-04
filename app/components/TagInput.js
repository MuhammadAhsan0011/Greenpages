"use client";

// This MUST be a Client Component — typing + Enter to add a removable chip
// needs local state. The chips are synced into a hidden
// <input name="tags"> as a comma-separated string on every change, so the
// surrounding <form action={...}> Server Action still receives it as plain
// form data with no client-side fetch/JS needed for submission itself
// (mirrors the pattern in RichTextEditor.js).

import { useState } from "react";

export default function TagInput({ name = "tags", defaultValue = "" }) {
  const [tags, setTags] = useState(
    defaultValue
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  );
  const [draft, setDraft] = useState("");

  function addTag() {
    const value = draft.trim();
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
    setDraft("");
  }

  function removeTag(tag) {
    setTags(tags.filter((existing) => existing !== tag));
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag();
    } else if (event.key === "Backspace" && !draft && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  return (
    <div className="tag-input">
      <div className="tag-input-chips">
        {tags.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "e.g. Digital Marketing, SEO, Web Design" : ""}
        />
      </div>
      <p className="editor-hint">Press enter after each tag.</p>
      <input type="hidden" name={name} value={tags.join(", ")} />
    </div>
  );
}
