import Link from "next/link";
import BlogCard from "../components/BlogCard";
import Button from "../components/Button";
import Breadcrumbs from "../components/Breadcrumbs";
import { posts, getAllParents, normalizeDbArticle } from "../data/blog";
import { getNamesUnderParent } from "@/lib/taxonomy";
import { createPublicClient } from "@/utils/supabase/public";
import { getPublishedPostsForCategoryNames } from "@/lib/seo/blogContent";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

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
export default async function BlogPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .eq("approved", true)
    .lte("published_at", new Date().toISOString());
  const normalizedArticles = (articles ?? []).map(normalizeDbArticle);

  let allPosts = [...posts, ...normalizedArticles].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Sidebar's "Search Articles" box and this page's own search both land
  // here via a plain GET — matching against title/excerpt/category covers
  // what a visitor would actually be looking for, without needing a
  // separate search index for a blog this size.
  if (query) {
    const needle = query.toLowerCase();
    allPosts = allPosts.filter((post) =>
      [post.title, post.excerpt, post.category].some((field) => field?.toLowerCase().includes(needle))
    );
  }

  // Only link parents that have at least one post — computed from the same
  // merged list above, so the nav never points at an empty archive.
  const categoriesWithPosts = getAllParents().filter(
    (parent) => getPublishedPostsForCategoryNames(getNamesUnderParent(parent), posts, normalizedArticles).length > 0
  );

  const collectionSchema = buildCollectionPageSchema(
    {
      name: "Green Pages Blog",
      description: "Practical, no-fluff articles on SEO, web development, and content marketing.",
      path: "/blog",
    },
    SITE_URL
  );

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <section className="hero">
        <div className="container">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Blog" }]} />
          <span className="hero-eyebrow">Blog</span>
          <h1>Insights on SEO, Web Development & Content Marketing</h1>
          <p className="hero-description">
            Practical, no-fluff articles from the Green Pages team — what&apos;s
            actually working in search, on the web, and in content right
            now.
          </p>
          <nav className="related-links" aria-label="Browse by category">
            {categoriesWithPosts.map((category) => (
              <Link href={`/blog/category/${category.slug}`} key={category.slug}>
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section aria-labelledby="blog-list-heading">
        <div className="container">
          <h2 id="blog-list-heading" className={query ? undefined : "visually-hidden"}>
            {query ? `Search Results for "${query}"` : "All Articles"}
          </h2>
          {allPosts.length > 0 ? (
            <div className="grid grid-3">
              {allPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p>
              No articles match &quot;{query}&quot;.{" "}
              <Link href="/blog">Browse all articles</Link> instead.
            </p>
          )}
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