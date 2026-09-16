import { services } from "./data/services";
import { posts, getAllParents as getAllBlogParents, getAllChildren as getAllBlogChildren } from "./data/blog";
import { PK_CITIES } from "./data/directoryCities";
import { getAllParents as getAllBusinessParents, getAllChildren as getAllBusinessChildren } from "./data/businessCategories";
import { LEGAL_PAGES } from "./data/legalPages";
import { createPublicClient } from "@/utils/supabase/public";
import { SITE_URL } from "@/lib/site";

const siteUrl = SITE_URL;

export default async function sitemap() {
  const lastModified = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.8 },
    { path: "/services", priority: 0.9 },
    { path: "/blog", priority: 0.8 },
    { path: "/businesses", priority: 0.7 },
    { path: "/pricing", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
  ].map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));

  const serviceRoutes = services.map((service) => ({
    url: `${siteUrl}/services/${service.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogRoutes = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const categoryRoutes = getAllBlogParents().map((parent) => ({
    url: `${siteUrl}/blog/category/${parent.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const subcategoryRoutes = getAllBlogChildren().map((child) => ({
    url: `${siteUrl}/blog/category/${child.parentSlug}/${child.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, created_at")
    .eq("approved", true);

  const articleRoutes = (articles ?? []).map((article) => ({
    url: `${siteUrl}/blog/${article.slug}`,
    lastModified: new Date(article.created_at),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // select("*") rather than naming needs_review explicitly — that column
  // doesn't exist until the Task 3 migration runs, and naming a column
  // that isn't there yet errors instead of just omitting it. See
  // legacyCategoryNames.js for the same reasoning on the category pages.
  const { data: businesses } = await supabase.from("businesses").select("*");

  // Excluded from the sitemap while flagged for manual review (e.g. a
  // listing with no verified Pakistan presence) — see
  // docs/seo/category-migration-diff.md's "needs manual review" section.
  const indexableBusinesses = (businesses ?? []).filter((business) => !business.needs_review);

  const businessRoutes = indexableBusinesses.map((business) => ({
    url: `${siteUrl}/businesses/${business.slug}`,
    lastModified: new Date(business.created_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const cityRoutes = PK_CITIES.map((city) => ({
    url: `${siteUrl}/businesses/city/${city.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const businessCategoryRoutes = getAllBusinessParents().map((parent) => ({
    url: `${siteUrl}/businesses/category/${parent.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const businessSubcategoryRoutes = getAllBusinessChildren().map((child) => ({
    url: `${siteUrl}/businesses/category/${child.parentSlug}/${child.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.55,
  }));

  const legalRoutes = LEGAL_PAGES.map((page) => ({
    url: `${siteUrl}/legal/${page.slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...blogRoutes,
    ...categoryRoutes,
    ...subcategoryRoutes,
    ...articleRoutes,
    ...businessRoutes,
    ...cityRoutes,
    ...businessCategoryRoutes,
    ...businessSubcategoryRoutes,
    ...legalRoutes,
  ];
}
