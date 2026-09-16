import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "../../../components/BlogCard";
import Button from "../../../components/Button";
import { posts, getAllParents, getParent, normalizeDbArticle } from "../../../data/blog";
import { getNamesUnderParent } from "@/lib/taxonomy";
import { createPublicClient } from "@/utils/supabase/public";

export const revalidate = 60;

// Pre-renders one parent-level archive page per top-level blog category.
export async function generateStaticParams() {
  return getAllParents().map((parent) => ({ parent: parent.slug }));
}

export async function generateMetadata({ params }) {
  const { parent: parentSlug } = await params;
  const parent = getParent(parentSlug);

  if (!parent) {
    return { title: "Category Not Found" };
  }

  const title = `${parent.name} Articles`;
  const description = `Browse all Green Pages articles on ${parent.name} — practical, no-fluff guides on ${parent.name.toLowerCase()} strategy and execution.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/category/${parent.slug}`,
    },
    openGraph: {
      title: `${title} | Green Pages Blog`,
      description,
      type: "website",
    },
  };
}

// Server Component — aggregates every post/article whose category matches
// this parent or any of its children. Articles have a single flat
// category field (no separate subcategory column like businesses), so a
// value there might be either level — checking both is how a parent page
// rolls up its children, not a data-cleanliness workaround.
export default async function BlogParentCategoryPage({ params }) {
  const { parent: parentSlug } = await params;
  const parent = getParent(parentSlug);

  if (!parent) {
    notFound();
  }

  const matchNames = new Set(getNamesUnderParent(parent));

  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .eq("approved", true)
    .lte("published_at", new Date().toISOString());

  const matchingStaticPosts = posts.filter((post) => matchNames.has(post.category));
  const matchingArticles = (articles ?? [])
    .filter((article) => matchNames.has(article.category))
    .map(normalizeDbArticle);

  const categoryPosts = [...matchingStaticPosts, ...matchingArticles].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <>
      <section className="service-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/blog">Blog</Link> / {parent.name}
          </p>
          <span className="category-badge">{parent.name}</span>
          <h1>{parent.name} Articles</h1>
          <p className="hero-description">
            Every Green Pages article on {parent.name.toLowerCase()} in one
            place — practical, no-fluff guides you can put to work.
          </p>
        </div>
      </section>

      {parent.children.length > 0 && (
        <section aria-labelledby="subcategories-heading">
          <div className="container">
            <h2 id="subcategories-heading" className="visually-hidden">
              {parent.name} Subcategories
            </h2>
            <nav className="directory-browse-links" aria-label="Subcategories">
              {parent.children.map((child) => (
                <Link href={`/blog/category/${parent.slug}/${child.slug}`} key={child.slug}>
                  {child.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      <section aria-labelledby="category-posts-heading">
        <div className="container">
          <h2 id="category-posts-heading" className="visually-hidden">
            {parent.name} Articles
          </h2>
          {categoryPosts.length > 0 ? (
            <div className="grid grid-3">
              {categoryPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p>No {parent.name} articles published yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
