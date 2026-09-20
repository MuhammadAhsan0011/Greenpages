import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../components/Button";
import Comments from "../../components/Comments";
import RichArticleBody from "../../components/RichArticleBody";
import SanitizedArticleBody from "../../components/SanitizedArticleBody";
import Breadcrumbs from "../../components/Breadcrumbs";
import BlogSidebar from "../../components/BlogSidebar";
import blogHeroImage from "../../../public/images/blog page head img.png";
import {
  posts,
  getPostBySlug,
  getAllParents,
  resolveCategoryNodes,
  estimateReadTime,
  normalizeDbArticle,
} from "../../data/blog";
import { getServiceBySlug } from "../../data/services";
import { createPublicClient } from "@/utils/supabase/public";
import { getNamesUnderParent } from "@/lib/taxonomy";
import { getPublishedPostsForCategoryNames } from "@/lib/seo/blogContent";

// Small, generic per-category glyphs for the sidebar's category list —
// purely decorative, same lightweight-icon convention already used for the
// business listing wizard's feature pills and steps. Falls back to a plain
// document icon for any parent not listed here.
const CATEGORY_ICONS = {
  business: "💼",
  finance: "💰",
  technology: "💻",
  "digital-marketing": "📈",
  education: "🎓",
  career: "🧭",
  "real-estate": "🏠",
  "health-fitness": "🏋️",
  "self-improvement": "🌱",
  relationships: "💬",
  "home-family": "🏡",
  travel: "✈️",
  "food-cooking": "🍳",
  sports: "⚽",
  writing: "✍️",
  "lifestyle-fashion": "👗",
  "pets-animals": "🐾",
  "news-society": "📰",
  "automotive-blog": "🚗",
  entertainment: "🎬",
};
const DEFAULT_CATEGORY_ICON = "📄";
const RECENT_POSTS_LIMIT = 4;
const SIDEBAR_CATEGORIES_LIMIT = 8;

// Revalidate periodically: static posts never change, but this also
// resolves slugs that only exist in the database (user-submitted
// articles), so those stay reasonably fresh once cached.
export const revalidate = 60;

// Pre-renders every built-in static post at build time. Slugs that belong
// to user-submitted articles aren't known at build time — Next.js renders
// those on first request and caches the result (dynamicParams defaults to
// true), so new articles are reachable immediately without a rebuild.
export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

// Static posts live in app/data/blog.js. User-submitted articles live in
// the Supabase "articles" table. This checks the static data first, then
// falls back to the database, normalizing both into the same shape.
async function getMergedPost(slug) {
  const staticPost = getPostBySlug(slug);
  if (staticPost) {
    return { ...staticPost, isUserSubmitted: false };
  }

  const supabase = createPublicClient();
  const { data: article } = await supabase
    .from("articles")
    .select("*, profiles(full_name)")
    .eq("slug", slug)
    .maybeSingle();

  // Scheduled articles (published_at in the future) stay invisible to
  // everyone, including the author, until that time arrives. A free-plan
  // article awaiting admin approval (see /admin) stays invisible too,
  // including to its own author — they see it listed as "Pending" on
  // /account/articles instead.
  if (!article || article.approved === false || new Date(article.published_at) > new Date()) {
    return null;
  }

  return {
    slug: article.slug,
    title: article.title,
    seoTitle: article.meta_title || article.title,
    category: article.category,
    date: article.published_at,
    author: article.profiles?.full_name ?? "Community Member",
    readTime: estimateReadTime(article.content),
    excerpt: article.excerpt,
    metaDescription: article.meta_description || article.excerpt,
    rawContent: article.content,
    contentFormat: article.content_format ?? "markdown",
    coverImageUrl: article.cover_image_url ?? null,
    tags: article.tags ?? null,
    relatedServiceSlug: null,
    isUserSubmitted: true,
  };
}

// Data for the sidebar's Categories and Recent Posts widgets — one extra
// query for every approved+published article (same shape as /blog's own
// listing query), merged with the static posts. Live counts, same rule as
// every other archive on the site: a parent only shows up once it actually
// has at least one post (getPublishedPostsForCategoryNames is the same
// merged-list function the category pages themselves render from, so this
// can't drift from what a visitor would actually find there).
async function getSidebarData(currentSlug) {
  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .eq("approved", true)
    .lte("published_at", new Date().toISOString());
  const normalizedArticles = (articles ?? []).map(normalizeDbArticle);

  const categories = getAllParents()
    .map((parent) => ({
      slug: parent.slug,
      name: parent.name,
      icon: CATEGORY_ICONS[parent.slug] ?? DEFAULT_CATEGORY_ICON,
      count: getPublishedPostsForCategoryNames(getNamesUnderParent(parent), posts, normalizedArticles).length,
    }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, SIDEBAR_CATEGORIES_LIMIT);

  const recentPosts = [...posts, ...normalizedArticles]
    .filter((post) => post.slug !== currentSlug)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, RECENT_POSTS_LIMIT);

  return { categories, recentPosts };
}

// Dynamic per-page SEO metadata, generated from the matching post's data.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getMergedPost(slug);

  if (!post) {
    return {
      title: "Article Not Found",
    };
  }

  const seoTitle = post.seoTitle ?? post.title;

  return {
    title: seoTitle,
    description: post.metaDescription,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${seoTitle} | Green Pages Blog`,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.date,
    },
  };
}

// Server Component — post content is static per slug and pre-rendered at
// build time, so no client-side JavaScript is needed to display it.
export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const [post, { categories, recentPosts }] = await Promise.all([
    getMergedPost(slug),
    getSidebarData(slug),
  ]);

  if (!post) {
    notFound();
  }

  const relatedService = getServiceBySlug(post.relatedServiceSlug);
  const { parent: categoryParent, child: categoryChild } = resolveCategoryNodes(post.category);
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // JSON-LD structured data for this article, so search engines can
  // understand its author, publish date, and headline directly.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    author: {
      "@type": post.isUserSubmitted ? "Person" : "Organization",
      name: post.author,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section className="hero post-hero">
        <div className="container">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              ...(categoryParent ? [{ name: categoryParent.name, path: `/blog/category/${categoryParent.slug}` }] : []),
              ...(categoryChild
                ? [
                    {
                      name: categoryChild.name,
                      path: `/blog/category/${categoryParent.slug}/${categoryChild.slug}`,
                    },
                  ]
                : []),
              { name: post.title },
            ]}
          />
          <Link
            href={
              categoryChild
                ? `/blog/category/${categoryParent.slug}/${categoryChild.slug}`
                : categoryParent
                  ? `/blog/category/${categoryParent.slug}`
                  : "/blog"
            }
            className="category-badge"
          >
            {post.category}
          </Link>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span>By {post.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formattedDate}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readTime}</span>
          </div>
          {post.tags && (
            <div className="tag-list">
              {post.tags.split(",").map((tag) => (
                <span className="tag-chip" key={tag}>
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Fixed brand banner, not the article's own cover image — that
              one only appears below, at the top of the article body
              (.article-cover-image). Same graphic on every article, so it's
              a static asset rather than per-post data. Rendered at its own
              natural 2103x748 proportions (no fill/crop box) so the full
              graphic always shows intact regardless of container width. */}
          <div className="post-hero-banner">
            <Image
              src={blogHeroImage}
              alt="Green Pages PK Blog"
              sizes="(max-width: 900px) 100vw, 1120px"
              style={{ width: "100%", height: "auto" }}
              priority
            />
          </div>
        </div>
      </section>

      <section className="blog-detail-section" aria-labelledby="article-heading">
        <div className="container">
          <h2 id="article-heading" className="visually-hidden">
            {post.title} — Full Article
          </h2>

          <div className="blog-detail-layout">
            <div className="blog-main">
              {post.coverImageUrl && (
                <div className="article-cover-image">
                  <Image
                    src={post.coverImageUrl}
                    alt={`Cover image for ${post.title}`}
                    fill
                    sizes="(max-width: 900px) 100vw, 800px"
                  />
                </div>
              )}
              {post.isUserSubmitted ? (
                <article className="service-section">
                  {post.contentFormat === "html" ? (
                    <SanitizedArticleBody html={post.rawContent} />
                  ) : (
                    <RichArticleBody content={post.rawContent} />
                  )}
                </article>
              ) : (
                post.sections.map((block, index) => (
                  <article className="service-section" key={block.heading ?? index}>
                    {block.heading && <h2>{block.heading}</h2>}
                    <p>{block.body}</p>
                    {block.table && (
                      <div className="table-wrap">
                        <table className="post-table">
                          {block.table.caption && (
                            <caption>{block.table.caption}</caption>
                          )}
                          <thead>
                            <tr>
                              {block.table.headers.map((header) => (
                                <th key={header} scope="col">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {block.table.rows.map((row) => (
                              <tr key={row[0]}>
                                {row.map((cell, cellIndex) =>
                                  cellIndex === 0 ? (
                                    <th key={cellIndex} scope="row">
                                      {cell}
                                    </th>
                                  ) : (
                                    <td key={cellIndex}>{cell}</td>
                                  )
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                ))
              )}

              {relatedService && (
                <div className="blog-main-subsection" aria-labelledby="related-service-heading">
                  <div className="section-header">
                    <span className="section-eyebrow">Related Service</span>
                    <h2 id="related-service-heading">
                      Need Help with {relatedService.title}?
                    </h2>
                    <p>{relatedService.shortDescription}</p>
                  </div>
                  <nav className="related-links" aria-label="Related pages">
                    <Link href={`/services/${relatedService.slug}`}>
                      Explore {relatedService.title}
                    </Link>
                    <Link href="/blog">All Articles</Link>
                    <Link href="/contact">Contact Us</Link>
                  </nav>
                </div>
              )}

              <div className="blog-main-subsection" aria-labelledby="post-cta-heading">
                <div className="cta-banner">
                  <h2 id="post-cta-heading">Ready to Put This Into Practice?</h2>
                  <p>
                    Talk to our team about applying these strategies to your
                    own website.
                  </p>
                  <div className="cta-actions">
                    <Button href="/contact" variant="inverted">
                      Get Your Free Consultation
                    </Button>
                  </div>
                </div>
              </div>

              <div className="blog-main-subsection" aria-labelledby="comments-heading">
                <h2 id="comments-heading" className="visually-hidden">
                  Comments
                </h2>
                <Comments slug={post.slug} />
              </div>
            </div>

            <BlogSidebar categories={categories} recentPosts={recentPosts} />
          </div>
        </div>
      </section>
    </>
  );
}
