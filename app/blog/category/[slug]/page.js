import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "../../../components/BlogCard";
import Button from "../../../components/Button";
import {
  getCategories,
  getCategoryBySlug,
  getPostsByCategorySlug,
  categorySlug,
  normalizeDbArticle,
} from "../../../data/blog";
import { getServiceBySlug } from "../../../data/services";
import { createPublicClient } from "@/utils/supabase/public";

// Revalidates periodically so user-submitted articles in this category
// show up without a rebuild.
export const revalidate = 60;

// Pre-renders one archive page per unique category (SEO, Web Development,
// Content Marketing) at build time, so search engines can crawl and index
// each topic cluster as its own static, crawlable page.
export async function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}

// Dynamic per-category SEO metadata.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  const title = `${category.name} Articles`;
  const description = `Browse all Green Pages articles on ${category.name} — practical, no-fluff guides on ${category.name.toLowerCase()} strategy and execution.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/category/${category.slug}`,
    },
    openGraph: {
      title: `${title} | Green Pages Blog`,
      description,
      type: "website",
    },
  };
}

// Server Component — the whole archive is derived from static post data,
// so it needs no client-side JavaScript.
export default async function BlogCategoryPage({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .lte("published_at", new Date().toISOString());

  const matchingArticles = (articles ?? [])
    .filter((article) => categorySlug(article.category) === slug)
    .map(normalizeDbArticle);

  const categoryPosts = [...getPostsByCategorySlug(slug), ...matchingArticles].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const relatedService = getServiceBySlug(slug);

  return (
    <>
      <section className="service-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/blog">Blog</Link> / {category.name}
          </p>
          <span className="category-badge">{category.name}</span>
          <h1>{category.name} Articles</h1>
          <p className="hero-description">
            Every Green Pages article on {category.name.toLowerCase()} in one
            place — practical, no-fluff guides you can put to work.
          </p>
        </div>
      </section>

      <section aria-labelledby="category-posts-heading">
        <div className="container">
          <h2 id="category-posts-heading" className="visually-hidden">
            {category.name} Articles
          </h2>
          <div className="grid grid-3">
            {categoryPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {relatedService && (
        <section className="section-alt" aria-labelledby="category-service-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Related Service</span>
              <h2 id="category-service-heading">
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

      <section aria-labelledby="category-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="category-cta-heading">
              Want This Applied to Your Own Site?
            </h2>
            <p>
              Book a free consultation and we&apos;ll show you where your
              biggest {category.name.toLowerCase()} opportunities are.
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
