import Link from "next/link";
import BlogCard from "../components/BlogCard";
import Button from "../components/Button";
import { posts, getCategories, normalizeDbArticle } from "../data/blog";
import { createPublicClient } from "@/utils/supabase/public";

export const metadata = {
  title: "Blog",
  description:
    "Practical, no-fluff articles on SEO, web development, and content marketing from the Green Pages team.",
  alternates: {
    canonical: "/blog",
  },
};

// Revalidates periodically so newly-published user articles show up here
// without needing a rebuild, while still being cached like the rest of the
// static-first blog.
export const revalidate = 60;

// Server Component — merges the site's static posts with user-submitted
// articles from Supabase into one list.
export default async function BlogPage() {
  const categories = getCategories();

  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .lte("published_at", new Date().toISOString());

  const allPosts = [...posts, ...(articles ?? []).map(normalizeDbArticle)].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Blog</span>
          <h1>Insights on SEO, Web Development & Content Marketing</h1>
          <p className="hero-description">
            Practical, no-fluff articles from the Green Pages team — what&apos;s
            actually working in search, on the web, and in content right
            now.
          </p>
          <nav className="related-links" aria-label="Browse by category">
            {categories.map((category) => (
              <Link href={`/blog/category/${category.slug}`} key={category.slug}>
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section aria-labelledby="blog-list-heading">
        <div className="container">
          <h2 id="blog-list-heading" className="visually-hidden">
            All Articles
          </h2>
          <div className="grid grid-3">
            {allPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-alt" aria-labelledby="blog-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="blog-cta-heading">Want Strategy Like This Applied to Your Site?</h2>
            <p>
              Book a free consultation and we&apos;ll show you exactly where
              your biggest growth opportunities are.
            </p>
            <div className="cta-actions">
              <Button href="/contact" variant="inverted">
                Get a Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}