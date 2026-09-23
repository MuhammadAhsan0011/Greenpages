import Image from "next/image";
import Link from "next/link";
import { getCategoryLinkPath } from "../data/blog";

const EXCERPT_LIMIT = 200;

// Older articles wrote a free-form excerpt with no length cap — trims it
// here at display time so every card stays a consistent height regardless
// of how long the stored excerpt actually is, breaking at a word boundary
// rather than mid-word.
function truncateExcerpt(text) {
  if (!text || text.length <= EXCERPT_LIMIT) return text;
  const truncated = text.slice(0, EXCERPT_LIMIT);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : EXCERPT_LIMIT)}…`;
}

// Server Component — renders static content driven entirely by props,
// so it never needs client-side JavaScript.
export default function BlogCard({ post }) {
  const { slug, title, excerpt, category, date, readTime, coverImageUrl } = post;

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="blog-card">
      {coverImageUrl && (
        <div className="blog-card-image">
          <Image
            src={coverImageUrl}
            alt={`Cover image for ${title}`}
            fill
            sizes="(max-width: 900px) 100vw, 360px"
          />
        </div>
      )}
      <Link href={getCategoryLinkPath(category)} className="category-badge">
        {category}
      </Link>
      <h3>
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h3>
      <p>{truncateExcerpt(excerpt)}</p>
      <div className="post-meta">
        <time dateTime={date}>{formattedDate}</time>
        <span aria-hidden="true">·</span>
        <span>{readTime}</span>
      </div>
      <Link href={`/blog/${slug}`} className="service-link">
        Read article →
      </Link>
    </article>
  );
}
