import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCard from "../../../components/BlogCard";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { posts, getAllParents, getParent, normalizeDbArticle } from "../../../data/blog";
import { getNamesUnderParent } from "@/lib/taxonomy";
import { createPublicClient } from "@/utils/supabase/public";
import { getPublishedPostsForCategoryNames } from "@/lib/seo/blogContent";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// Pre-renders one parent-level archive page per top-level blog category.
export async function generateStaticParams() {
  return getAllParents().map((parent) => ({ parent: parent.slug }));
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
  const { parent: parentSlug } = await params;
  const parent = getParent(parentSlug);

  if (!parent) {
    return { title: "Category Not Found" };
  }

  const supabase = createPublicClient();
  const normalizedArticles = await fetchNormalizedArticles(supabase);
  const categoryPosts = getPublishedPostsForCategoryNames(getNamesUnderParent(parent), posts, normalizedArticles);

  const title = parent.metaTitle || `${parent.name} Articles | Green Pages`;
  const description =
    parent.metaDescription ||
    `Browse all Green Pages articles on ${parent.name} — practical, no-fluff guides on ${parent.name.toLowerCase()} strategy and execution.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/category/${parent.slug}`,
    },
    robots: getArchiveRobots(categoryPosts.length),
    openGraph: {
      title: `${title} | Green Pages Blog`,
      description,
      type: "website",
      url: `${SITE_URL}/blog/category/${parent.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  const supabase = createPublicClient();
  const normalizedArticles = await fetchNormalizedArticles(supabase);

  const categoryPosts = getPublishedPostsForCategoryNames(
    getNamesUnderParent(parent),
    posts,
    normalizedArticles
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Only surface children that actually have at least one post — computed
  // from the same merged list above, so nav never links to an empty child.
  const childPostCounts = getNamesUnderParent(parent).reduce((acc, name) => {
    acc[name] = getPublishedPostsForCategoryNames([name], posts, normalizedArticles).length;
    return acc;
  }, {});
  const childrenWithPosts = parent.children.filter((child) => (childPostCounts[child.name] ?? 0) > 0);

  const collectionSchema = buildCollectionPageSchema(
    {
      name: `${parent.name} Articles`,
      description: parent.description || undefined,
      path: `/blog/category/${parent.slug}`,
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
          <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: parent.name }]} />
          <span className="category-badge">{parent.name}</span>
          <h1>{parent.name} Articles</h1>
          <p className="hero-description">
            Every Green Pages article on {parent.name.toLowerCase()} in one
            place — practical, no-fluff guides you can put to work.
          </p>
        </div>
      </section>

      {childrenWithPosts.length > 0 && (
        <section aria-labelledby="subcategories-heading">
          <div className="container">
            <h2 id="subcategories-heading" className="visually-hidden">
              {parent.name} Subcategories
            </h2>
            <nav className="directory-browse-links" aria-label="Subcategories">
              {childrenWithPosts.map((child) => (
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
