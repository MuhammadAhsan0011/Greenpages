import Image from "next/image";
import Link from "next/link";
import { categorySlug } from "../data/blog";

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
      <Link href={`/blog/category/${categorySlug(category)}`} className="category-badge">
        {category}
      </Link>
      <h3>
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h3>
      <p>{excerpt}</p>
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
