import { services } from "./data/services";
import { posts, getCategories } from "./data/blog";
import { createPublicClient } from "@/utils/supabase/public";

// TODO: Replace "https://example.com" with your real production domain.
const siteUrl = "https://example.com";

export default async function sitemap() {
  const lastModified = new Date();

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.8 },
    { path: "/services", priority: 0.9 },
    { path: "/blog", priority: 0.8 },
    { path: "/businesses", priority: 0.7 },
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

  const categoryRoutes = getCategories().map((category) => ({
    url: `${siteUrl}/blog/category/${category.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  const supabase = createPublicClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, created_at");

  const articleRoutes = (articles ?? []).map((article) => ({
    url: `${siteUrl}/blog/${article.slug}`,
    lastModified: new Date(article.created_at),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, created_at");

  const businessRoutes = (businesses ?? []).map((business) => ({
    url: `${siteUrl}/businesses/${business.id}`,
    lastModified: new Date(business.created_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...blogRoutes,
    ...categoryRoutes,
    ...articleRoutes,
    ...businessRoutes,
  ];
}
