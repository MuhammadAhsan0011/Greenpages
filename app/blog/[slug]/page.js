import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../components/Button";
import Comments from "../../components/Comments";
import RichArticleBody from "../../components/RichArticleBody";
import { posts, getPostBySlug, categorySlug, estimateReadTime } from "../../data/blog";
import { getServiceBySlug } from "../../data/services";
import { createPublicClient } from "@/utils/supabase/public";

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

  if (!article) return null;

  return {
    slug: article.slug,
    title: article.title,
    category: article.category,
    date: article.created_at,
    author: article.profiles?.full_name ?? "Community Member",
    readTime: estimateReadTime(article.content),
    excerpt: article.excerpt,
    metaDescription: article.excerpt,
    rawContent: article.content,
    relatedServiceSlug: null,
    isUserSubmitted: true,
  };
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

  return {
    title: post.title,
    description: post.metaDescription,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | GrowthPro Blog`,
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
  const post = await getMergedPost(slug);

  if (!post) {
    notFound();
  }

  const relatedService = getServiceBySlug(post.relatedServiceSlug);
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

      <section className="service-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/blog">Blog</Link> / {post.title}
          </p>
          <Link
            href={`/blog/category/${categorySlug(post.category)}`}
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
        </div>
      </section>

      <section aria-labelledby="article-heading">
        <div className="container">
          <h2 id="article-heading" className="visually-hidden">
            {post.title} — Full Article
          </h2>
          {post.isUserSubmitted ? (
            <article className="service-section">
              <RichArticleBody content={post.rawContent} />
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
        </div>
      </section>

      {relatedService && (
        <section className="section-alt" aria-labelledby="related-service-heading">
          <div className="container">
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
        </section>
      )}

      <section aria-labelledby="post-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="post-cta-heading">Ready to Put This Into Practice?</h2>
            <p>
              Talk to our team about applying these strategies to your own
              website.
            </p>
            <div className="cta-actions">
              <Button href="/contact" variant="inverted">
                Get Your Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="comments-heading">
        <div className="container">
          <h2 id="comments-heading" className="visually-hidden">
            Comments
          </h2>
          <Comments slug={post.slug} />
        </div>
      </section>
    </>
  );
}
