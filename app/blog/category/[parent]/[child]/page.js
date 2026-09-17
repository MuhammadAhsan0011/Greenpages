import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "../../../../components/BlogCard";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import { posts, getAllParents, getParent, getChild, normalizeDbArticle } from "../../../../data/blog";
import { createPublicClient } from "@/utils/supabase/public";
import { getPublishedPostsForCategoryNames } from "@/lib/seo/blogContent";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// Pre-renders one page per child blog category at build time.
export async function generateStaticParams() {
  return getAllParents().flatMap((parent) =>
    parent.children.map((child) => ({ parent: parent.slug, child: child.slug }))
  );
}

async function fetchNormalizedArticles(supabase) {
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, category, published_at, excerpt, content, cover_image_url, tags")
    .eq("approved", true)
    .lte("published_at", new Date().toISOString());
  return (articles ?? []).map(normalizeDbArticle);
}

export async function generateMetadata({ params }) {
  const { parent: parentSlug, child: childSlug } = await params;
  const parent = getParent(parentSlug);
  const child = parent ? getChild(parentSlug, childSlug) : null;

  if (!parent || !child) {
    return { title: "Category Not Found" };
  }

  const supabase = createPublicClient();
  const normalizedArticles = await fetchNormalizedArticles(supabase);
  const categoryPosts = getPublishedPostsForCategoryNames([child.name], posts, normalizedArticles);

  const title = child.metaTitle || `${child.name} Articles | Green Pages`;
  const description =
    child.metaDescription ||
    `Browse all Green Pages articles on ${child.name} — practical, no-fluff guides you can put to work.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/category/${parent.slug}/${child.slug}`,
    },
    robots: getArchiveRobots(categoryPosts.length),
    openGraph: {
      title: `${title} | Green Pages Blog`,
      description,
      type: "website",
      url: `${SITE_URL}/blog/category/${parent.slug}/${child.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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
  const normalizedArticles = await fetchNormalizedArticles(supabase);

  const categoryPosts = getPublishedPostsForCategoryNames([child.name], posts, normalizedArticles).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const collectionSchema = buildCollectionPageSchema(
    {
      name: `${child.name} Articles`,
      description: child.description || undefined,
      path: `/blog/category/${parent.slug}/${child.slug}`,
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

      <section className="service-hero">
        <div className="container">
          <Breadcrumbs
            items={[
              { name: "Blog", path: "/blog" },
              { name: parent.name, path: `/blog/category/${parent.slug}` },
              { name: child.name },
            ]}
          />
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
