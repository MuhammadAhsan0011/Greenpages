// Server Component — parses the lightweight markdown-style syntax written
// with ArticleEditor.js (**bold**, _italic_, ~~strikethrough~~,
// __underline__, "## " headings, "- " lists) into plain React elements.
// Deliberately never uses dangerouslySetInnerHTML: user-submitted content
// is untrusted (articles publish instantly with no review step), so
// rendering it as real React nodes instead of raw HTML rules out script
// injection entirely, rather than relying on escaping.

function parseInline(text, keyPrefix) {
  const tokenPattern = /(\*\*[^*]+\*\*|~~[^~]+~~|__[^_]+__|_[^_]+_)/g;
  const parts = text.split(tokenPattern).filter((part) => part !== "");

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <s key={key}>{part.slice(2, -2)}</s>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <u key={key}>{part.slice(2, -2)}</u>;
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <span key={key}>{part}</span>;
  });
}

function parseContent(content) {
  return content
    .split(/\n\s*\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((paragraph) => {
      if (paragraph.startsWith("## ")) {
        return { type: "heading", text: paragraph.slice(3).trim() };
      }

      const lines = paragraph.split("\n").map((line) => line.trim());
      if (lines.every((line) => line.startsWith("- "))) {
        return { type: "list", items: lines.map((line) => line.slice(2).trim()) };
      }

      return { type: "paragraph", text: paragraph };
    });
}

export default function RichArticleBody({ content }) {
  const blocks = parseContent(content);

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return <h2 key={index}>{block.text}</h2>;
        }
        if (block.type === "list") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item, `${index}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{parseInline(block.text, `${index}`)}</p>;
      })}
    </>
  );
}
