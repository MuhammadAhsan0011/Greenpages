import Image from "next/image";
import Link from "next/link";
import Button from "./Button";

// Server Component — sticky (via .blog-sidebar in globals.css) but purely
// presentational, driven entirely by props the article page already
// computed server-side (live category counts, recent posts). No client
// interactivity needed: the search box is a plain GET form to /blog?q=...,
// same pattern as the businesses directory search.
export default function BlogSidebar({ categories, recentPosts }) {
  return (
    <aside className="blog-sidebar" aria-label="Blog sidebar">
      <div className="wizard-sidebar-card">
        <h3>
          <span aria-hidden="true">🔍</span> Search Articles
        </h3>
        <form action="/blog" method="get" className="sidebar-search-form">
          <label htmlFor="sidebar-search" className="visually-hidden">
            Search blog posts
          </label>
          <input
            id="sidebar-search"
            name="q"
            type="text"
            placeholder="Search blog posts..."
          />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>

      {categories.length > 0 && (
        <div className="wizard-sidebar-card">
          <h3>
            <span aria-hidden="true">🗂️</span> Categories
          </h3>
          <ul className="sidebar-category-list">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/blog/category/${category.slug}`} className="sidebar-category-item">
                  <span className="sidebar-category-icon" aria-hidden="true">
                    {category.icon}
                  </span>
                  <span className="sidebar-category-name">{category.name}</span>
                  <span className="sidebar-category-count">{category.count}</span>
                  <span className="sidebar-category-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentPosts.length > 0 && (
        <div className="wizard-sidebar-card">
          <h3>
            <span aria-hidden="true">🕒</span> Recent Posts
          </h3>
          <ul className="sidebar-post-list">
            {recentPosts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="sidebar-post-item">
                  {post.coverImageUrl ? (
                    <span className="sidebar-post-thumb">
                      <Image
                        src={post.coverImageUrl}
                        alt=""
                        fill
                        sizes="64px"
                      />
                    </span>
                  ) : (
                    <span className="sidebar-post-thumb sidebar-post-thumb-empty" aria-hidden="true" />
                  )}
                  <span className="sidebar-post-info">
                    <span className="sidebar-post-title">{post.title}</span>
                    <time className="sidebar-post-date" dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sidebar-cta-card">
        <h3>Let&apos;s Grow Together</h3>
        <p>Get expert digital solutions and marketing strategies for your business.</p>
        <Button href="/contact" variant="inverted">
          Contact Us
        </Button>
      </div>
    </aside>
  );
}
