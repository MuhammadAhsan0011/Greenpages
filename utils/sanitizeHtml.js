import DOMPurify from "isomorphic-dompurify";

// Whitelist matching exactly what the TipTap toolbar in RichTextEditor.js
// can produce. Used both when an article is submitted (Server Action) and
// again when it's rendered (defense in depth, in case a row is ever
// edited directly in the Supabase Table Editor). No script/iframe/event
// handlers/style are ever allowed.
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
  "hr",
  "table",
  "tbody",
  "thead",
  "tr",
  "th",
  "td",
  "span",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "style", "colspan", "rowspan"];

export function sanitizeArticleHtml(html) {
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Only allow inline "color:"/"text-align:" styles (set via the
    // toolbar's color picker and alignment buttons) — strips anything
    // else that could smuggle in behavior via CSS.
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:)/i,
  });
}
