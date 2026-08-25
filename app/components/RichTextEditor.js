"use client";

// This component MUST be a Client Component — TipTap edits a real
// contentEditable DOM node and needs React state/refs/effects, none of
// which exist on the server. Its HTML output is synced into a hidden
// <input name="content"> on every keystroke, so the surrounding
// <form action={createArticle}> Server Action still receives it as plain
// form data with no client-side fetch/JS needed for submission itself.
//
// Security note: this editor can produce raw HTML (unlike the plain
// ArticleEditor.js used for Free-tier articles, which can only ever
// produce inert markdown-lite text). That HTML is NOT trusted just
// because it came from this component — app/account/articles/actions.js
// re-sanitizes it server-side with the same allowlist as
// utils/sanitizeHtml.js before it's ever stored or rendered.

import { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { uploadInlineImage } from "../account/articles/actions";

export default function RichTextEditor({ defaultValue = "" }) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, autolink: true }),
      ImageExtension,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: defaultValue,
    onUpdate: ({ editor: current }) => setHtml(current.getHTML()),
    editorProps: {
      attributes: { class: "tiptap-content" },
    },
  });

  const insertLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Link URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleImageFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file || !editor) return;

      setUploadError("");

      // Checked client-side first so an oversized file fails instantly
      // with a clear reason, instead of a slow, opaque round-trip.
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("That image is too large — max size is 5MB.");
        return;
      }
      if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
        setUploadError("Unsupported format — use PNG, JPEG, WebP, or GIF.");
        return;
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      let result;
      try {
        result = await uploadInlineImage(formData);
      } catch (err) {
        result = { error: err?.message || "Upload failed. Please try again." };
      }
      setUploading(false);

      if (result?.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
      } else {
        setUploadError(result?.error || "Something went wrong uploading that image.");
      }
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className="editor-wrap">
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className={editor.isActive("bold") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={editor.isActive("italic") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={editor.isActive("underline") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className={editor.isActive("strike") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <label className="editor-color-swatch">
          <span className="visually-hidden">Text color</span>
          <input
            type="color"
            onChange={(event) =>
              editor.chain().focus().setColor(event.target.value).run()
            }
          />
        </label>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          ⯇
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          ▬
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          ⯈
        </button>
        <button
          type="button"
          className={editor.isActive("bulletList") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          type="button"
          className={editor.isActive("orderedList") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>
        <button
          type="button"
          className={editor.isActive("blockquote") ? "is-active" : ""}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          ❝
        </button>
        <button type="button" onClick={insertLink}>
          🔗
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Insert image — PNG, JPEG, WebP, or GIF, max 5MB"
        >
          {uploading ? "…" : "🖼️"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={handleImageFile}
        />
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          ⊞ Table
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          ―
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
        >
          ↷
        </button>
      </div>
      {uploadError && <p className="form-error editor-inline-error">{uploadError}</p>}
      <EditorContent editor={editor} />
      <input type="hidden" name="content" value={html} />
    </div>
  );
}
