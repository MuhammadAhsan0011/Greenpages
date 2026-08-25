"use client";

// TipTap/ProseMirror isn't safe to server-render (it touches browser-only
// APIs during initialization), so this wrapper forces RichTextEditor to
// mount client-side only. A `dynamic(..., { ssr: false })` call has to
// live inside a Client Component in the App Router — it can't be used
// directly from the Server Component page that renders this.

import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => <p className="editor-hint">Loading editor…</p>,
});

export default function RichTextEditorClientOnly(props) {
  return <RichTextEditor {...props} />;
}
