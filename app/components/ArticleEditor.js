"use client";

// This component MUST be a Client Component because the formatting
// buttons need direct access to the textarea's selection (selectionStart/
// selectionEnd) and must update its value in response to onClick — both
// only exist in the browser. It renders a plain <textarea name="content">,
// so it still submits normally through the surrounding Server Action form
// with zero extra client JavaScript required for the submission itself.

import { useRef, useState } from "react";

function wrapSelection(value, start, end, prefix, suffix) {
  const selected = value.slice(start, end) || "text";
  const before = value.slice(0, start);
  const after = value.slice(end);
  const next = `${before}${prefix}${selected}${suffix}${after}`;
  const cursorStart = start + prefix.length;
  const cursorEnd = cursorStart + selected.length;
  return { next, cursorStart, cursorEnd };
}

function prefixCurrentLine(value, start, prefix) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  const cursor = start + prefix.length;
  return { next, cursorStart: cursor, cursorEnd: cursor };
}

export default function ArticleEditor({ defaultValue = "", extraFormatting = false }) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef(null);

  function applyChange(transform) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { next, cursorStart, cursorEnd } = transform(
      value,
      textarea.selectionStart,
      textarea.selectionEnd
    );

    setValue(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  return (
    <div className="editor-wrap">
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          onClick={() =>
            applyChange((v, s, e) => wrapSelection(v, s, e, "**", "**"))
          }
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => applyChange((v, s, e) => wrapSelection(v, s, e, "_", "_"))}
        >
          <em>I</em>
        </button>
        {extraFormatting && (
          <>
            <button
              type="button"
              onClick={() =>
                applyChange((v, s, e) => wrapSelection(v, s, e, "__", "__"))
              }
            >
              <u>U</u>
            </button>
            <button
              type="button"
              onClick={() =>
                applyChange((v, s, e) => wrapSelection(v, s, e, "~~", "~~"))
              }
            >
              <s>S</s>
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => applyChange((v, s) => prefixCurrentLine(v, s, "## "))}
        >
          Heading
        </button>
        <button
          type="button"
          onClick={() => applyChange((v, s) => prefixCurrentLine(v, s, "- "))}
        >
          • List
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id="content"
        name="content"
        rows={14}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Write your article here. Select text and use the buttons above to format it."
        required
      />
    </div>
  );
}
