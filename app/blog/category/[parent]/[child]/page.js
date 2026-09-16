import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "../../../../components/BlogCard";
import { posts, getAllParents, getParent, getChild, normalizeDbArticle } from "../../../../data/blog";
import { createPublicClient } from "@/utils/supabase/public";

export const revalidate = 60;

// Pre-renders one page per child blog category at build time.
export async function generateStaticParams() {
  return getAllParents().flatMap((parent) =>
    parent.children.map((child) => ({ parent: parent.slug, child: child.slug }))
  );
}

export async function generateMetadata({ params }) {
  const { parent: parentSlug, child: childSlug } = await params;
  const parent = getParent(parentSlug);
  const child = parent ? getChild(parentSlug, childSlug) : null;

  if (!parent || !child) {
    return { title: "Category Not Found" };
  }

  const title = `${child.name} Articles`;
  const description = `Browse all Green Pages articles on ${child.name} — practical, no-fluff guides you can put to work.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/category/${parent.slug}/${child.slug}`,
    },
    openGraph: {
      title: `${title} | Green Pages Blog`,
      description,
      type: "website",
    },
  };
}

// Server Component — a single child blog category's archive.
export default async function BlogChildCategoryPage({ params }) {
  const { parent: parentSlug, child: childSlug } = await params;
  const parent = getParent(parentSlug);
  const child = parent ? getChild(parentSlug, childSlug) : null;

  if (!parent || !child) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .eq("approved", true)
    .lte("published_at", new Date().toISOString());

  const matchingStaticPosts = posts.filter((post) => post.category === child.name);
  const matchingArticles = (articles ?? [])
    .filter((article) => article.category === child.name)
    .map(normalizeDbArticle);

  const categoryPosts = [...matchingStaticPosts, ...matchingArticles].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <>
      <section className="service-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/blog">Blog</Link> /{" "}
            <Link href={`/blog/category/${parent.slug}`}>{parent.name}</Link> / {child.name}
          </p>
          <span className="category-badge">{child.name}</span>
          <h1>{child.name} Articles</h1>
          <p className="hero-description">
            Every Green Pages article on {child.name.toLowerCase()} in one
            place — practical, no-fluff guides you can put to work.
          </p>
        </div>
      </section>

      <section aria-labelledby="category-posts-heading">
        <div className="container">
          <h2 id="category-posts-heading" className="visually-hidden">
            {child.name} Articles
          </h2>
          {categoryPosts.length > 0 ? (
            <div className="grid grid-3">
              {categoryPosts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p>No {child.name} articles published yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
