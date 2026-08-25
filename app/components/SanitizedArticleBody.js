import { sanitizeArticleHtml } from "@/utils/sanitizeHtml";

// Server Component. Renders HTML produced by RichTextEditor.js
// (Verified/Featured articles only). The content was already sanitized
// once in app/account/articles/actions.js before being stored — this
// sanitizes it again on the way out, so a direct edit to the database row
// (e.g. via the Supabase Table Editor) can never introduce something
// unsafe that skipped the write-time check.
export default function SanitizedArticleBody({ html }) {
  const safeHtml = sanitizeArticleHtml(html);
  return (
    <div
      className="rich-html-content"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
