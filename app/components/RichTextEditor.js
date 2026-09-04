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

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
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

// Adds a `title` attribute on top of the extension's default href/target/rel —
// kept in sync with the "a" entry in utils/sanitizeHtml.js's allowlist.
const LinkWithTitle = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) =>
          attributes.title ? { title: attributes.title } : {},
      },
    };
  },
});

export default function RichTextEditor({ defaultValue = "", name = "content" }) {
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);
  const linkPopoverRef = useRef(null);

  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkWithTitle.configure({ openOnClick: false, autolink: true }),
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

  // Closes the link popover on an outside click, same pattern as the
  // account menu dropdown in AuthNav.js.
  useEffect(() => {
    if (!linkPopoverOpen) return;
    function handleClickOutside(event) {
      if (linkPopoverRef.current && !linkPopoverRef.current.contains(event.target)) {
        setLinkPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [linkPopoverOpen]);

  const openLinkPopover = useCallback(() => {
    if (!editor) return;
    const editingExisting = editor.isActive("link");
    if (editingExisting) {
      editor.chain().focus().extendMarkRange("link").run();
    }
    const attrs = editor.getAttributes("link");
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ");

    setLinkUrl(attrs.href || "");
    setLinkTitle(attrs.title || "");
    setLinkNewTab(attrs.target === "_blank");
    setLinkText(selectedText);
    setLinkPopoverOpen(true);
  }, [editor]);

  const confirmLink = useCallback(
    (event) => {
      event.preventDefault();
      if (!editor || !linkUrl.trim()) {
        setLinkPopoverOpen(false);
        return;
      }
      const attrs = {
        href: linkUrl.trim(),
        target: linkNewTab ? "_blank" : null,
        rel: linkNewTab ? "noopener noreferrer" : null,
        title: linkTitle.trim() || null,
      };
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent({
          type: "text",
          text: linkText.trim() || linkUrl.trim(),
          marks: [{ type: "link", attrs }],
        })
        .run();
      setLinkPopoverOpen(false);
    },
    [editor, linkUrl, linkText, linkTitle, linkNewTab]
  );

  const handleUnlink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }, [editor]);

  const handleOpenLink = useCallback(() => {
    if (!editor) return;
    const href = editor.getAttributes("link").href;
    if (href) window.open(href, "_blank", "noopener,noreferrer");
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
        <div className="editor-link-wrap" ref={linkPopoverRef}>
          <button
            type="button"
            className={editor.isActive("link") ? "is-active" : ""}
            onClick={openLinkPopover}
          >
            🔗
          </button>
          {linkPopoverOpen && (
            <div className="editor-link-popover">
              <label>
                URL
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                />
              </label>
              <label>
                Text
                <input
                  type="text"
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  placeholder="Link text"
                />
              </label>
              <label>
                Title
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(event) => setLinkTitle(event.target.value)}
                  placeholder="Optional tooltip"
                />
              </label>
              <label className="editor-link-checkbox">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(event) => setLinkNewTab(event.target.checked)}
                />
                Open in new tab
              </label>
              <div className="editor-link-popover-actions">
                <button type="button" onClick={() => setLinkPopoverOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="editor-link-insert" onClick={confirmLink}>
                  {editor.isActive("link") ? "Update" : "Insert"}
                </button>
              </div>
            </div>
          )}
        </div>
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
      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: current }) => current.isActive("link")}
        options={{ placement: "bottom", offset: 8 }}
      >
        <div className="editor-link-bubble">
          <button type="button" onClick={handleOpenLink} title="Open link">
            ↗
          </button>
          <button type="button" onClick={openLinkPopover} title="Edit link">
            ✎
          </button>
          <button type="button" onClick={handleUnlink} title="Remove link">
            ✕
          </button>
        </div>
      </BubbleMenu>
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
