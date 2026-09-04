import sanitizeHtml from "sanitize-html";

// Whitelist matching exactly what the TipTap toolbar in RichTextEditor.js
// can produce. Used both when an article is submitted (Server Action) and
// again when it's rendered (defense in depth, in case a row is ever
// edited directly in the Supabase Table Editor). No script/iframe/event
// handlers are ever allowed.
//
// Uses sanitize-html rather than isomorphic-dompurify/jsdom — the latter
// pulls in html-encoding-sniffer, which ships an ESM-only dependency that
// breaks require() under Vercel's serverless bundler (ERR_REQUIRE_ESM).
// sanitize-html has no DOM/jsdom dependency, so it works reliably there.
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

const ALLOWED_ATTRIBUTES = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "style"],
  span: ["style"],
  p: ["style"],
  h2: ["style"],
  h3: ["style"],
  h4: ["style"],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
};

// Only "color:" and "text-align:" inline styles survive — set via the
// toolbar's color picker and alignment buttons. Anything else in a style
// attribute is stripped.
const ALLOWED_STYLES = {
  "*": {
    color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(.*\)$/],
    "text-align": [/^left$/, /^center$/, /^right$/],
  },
};

export function sanitizeArticleHtml(html) {
  return sanitizeHtml(html ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedStyles: ALLOWED_STYLES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  });
}
