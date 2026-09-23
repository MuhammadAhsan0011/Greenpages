import { services } from "./data/services";
import {
  posts,
  getAllParents as getAllBlogParents,
  getAllChildren as getAllBlogChildren,
  normalizeDbArticle,
} from "./data/blog";
import { getNamesUnderParent } from "@/lib/taxonomy";
import { PK_CITIES } from "./data/directoryCities";
import { getAllParents as getAllBusinessParents, getAllChildren as getAllBusinessChildren } from "./data/businessCategories";
import { LEGAL_PAGES } from "./data/legalPages";
import { createPublicClient } from "@/utils/supabase/public";
import { SITE_URL } from "@/lib/site";
import {
  isPublishedBusiness,
  filterForParent,
  filterForChild,
  filterForCity,
  filterForCityParent,
} from "@/lib/seo/businessListings";
import { getPublishedPostsForCategoryNames } from "@/lib/seo/blogContent";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { fetchActiveJobCategories, buildJobCategoryTree, getJobCategoryIdsUnderParent } from "@/lib/jobCategories";
import {
  isPublishedJob,
  filterForCategory as filterJobsForCategory,
  filterForCity as filterJobsForCity,
  filterForCityCategory as filterJobsForCityCategory,
} from "@/lib/seo/jobListings";

const siteUrl = SITE_URL;

// Fully dynamic — every archive URL below is gated on the same live
// INDEXING_THRESHOLD rule the pages themselves use (see lib/seo/indexing.js),
// so an under-threshold category/city/child never appears here even though
// its route technically resolves. Exactly two Supabase queries run for the
// whole build: one for businesses, one for articles — every count below
// (parent, child, city, city×category) is grouped from those two
// in-memory, not queried per category.
export default async function sitemap() {
  const lastModified = new Date();
  const supabase = createPublicClient();

  const [{ data: businessRows }, { data: articleRows }, jobCategories, { data: jobRows }] = await Promise.all([
    supabase
      .from("businesses")
      .select("slug, created_at, category, subcategory, city, needs_review"),
    supabase
      .from("articles")
      .select("slug, created_at, published_at, category, approved, content")
      .eq("approved", true)
      .lte("published_at", new Date().toISOString()),
    fetchActiveJobCategories(supabase),
    supabase.from("jobs").select("*"),
  ]);

  const businesses = businessRows ?? [];
  const normalizedArticles = (articleRows ?? []).map(normalizeDbArticle);
  const jobCategoryTree = buildJobCategoryTree(jobCategories);
  const publishedJobs = (jobRows ?? []).filter(isPublishedJob);

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.8 },
    { path: "/services", priority: 0.9 },
    { path: "/blog", priority: 0.8 },
    { path: "/businesses", priority: 0.7 },
    { path: "/jobs", priority: 0.7 },
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

  // Static seed posts are permanent, always-published content — no
  // threshold applies to an individual post/business/article page, only to
  // archive pages that aggregate them.
  const blogRoutes = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const articleRoutes = (articleRows ?? []).map((article) => ({
    url: `${siteUrl}/blog/${article.slug}`,
    lastModified: new Date(article.created_at ?? article.published_at),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const indexableBusinesses = businesses.filter(isPublishedBusiness);
  const businessRoutes = indexableBusinesses.map((business) => ({
    url: `${siteUrl}/businesses/${business.slug}`,
    lastModified: new Date(business.created_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // --- Blog category archives ---
  const blogCategoryRoutes = getAllBlogParents()
    .map((parent) => ({
      parent,
      count: getPublishedPostsForCategoryNames(getNamesUnderParent(parent), posts, normalizedArticles).length,
    }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ parent }) => ({
      url: `${siteUrl}/blog/category/${parent.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

  const blogSubcategoryRoutes = getAllBlogChildren()
    .map((child) => ({
      child,
      count: getPublishedPostsForCategoryNames([child.name], posts, normalizedArticles).length,
    }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ child }) => ({
      url: `${siteUrl}/blog/category/${child.parentSlug}/${child.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.55,
    }));

  // --- Directory category archives ---
  const businessCategoryRoutes = getAllBusinessParents()
    .map((parent) => ({ parent, count: filterForParent(businesses, parent.name).length }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ parent }) => ({
      url: `${siteUrl}/businesses/category/${parent.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

  const businessSubcategoryRoutes = getAllBusinessChildren()
    .map((child) => ({
      child,
      count: filterForChild(businesses, child.parentName, child.name).length,
    }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ child }) => ({
      url: `${siteUrl}/businesses/category/${child.parentSlug}/${child.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.55,
    }));

  // --- City and city×category archives ---
  const cityRoutes = PK_CITIES.map((city) => ({ city, count: filterForCity(businesses, city.name).length }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ city }) => ({
      url: `${siteUrl}/businesses/city/${city.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const cityCategoryRoutes = [];
  for (const city of PK_CITIES) {
    for (const parent of getAllBusinessParents()) {
      const count = filterForCityParent(businesses, city.name, parent.name).length;
      if (getArchiveRobots(count).index) {
        cityCategoryRoutes.push({
          url: `${siteUrl}/businesses/city/${city.slug}/${parent.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  }

  const legalRoutes = LEGAL_PAGES.map((page) => ({
    url: `${siteUrl}/legal/${page.slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  // --- Job postings ---
  const jobRoutes = publishedJobs.map((job) => ({
    url: `${siteUrl}/jobs/${job.slug}`,
    lastModified: new Date(job.created_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // --- Job category archives ---
  const jobCategoryParentRoutes = jobCategoryTree
    .map((parent) => ({ parent, count: filterJobsForCategory(publishedJobs, getJobCategoryIdsUnderParent(parent)).length }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ parent }) => ({
      url: `${siteUrl}/jobs/category/${parent.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.65,
    }));

  const jobCategoryChildRoutes = jobCategoryTree
    .flatMap((parent) => parent.children)
    .map((child) => ({ child, count: filterJobsForCategory(publishedJobs, [child.id]).length }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ child }) => ({
      url: `${siteUrl}/jobs/category/${child.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.55,
    }));

  // --- Job city and city×category archives ---
  const jobCityRoutes = PK_CITIES.map((city) => ({ city, count: filterJobsForCity(publishedJobs, city.name).length }))
    .filter(({ count }) => getArchiveRobots(count).index)
    .map(({ city }) => ({
      url: `${siteUrl}/jobs/city/${city.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const jobCityCategoryRoutes = [];
  for (const city of PK_CITIES) {
    for (const parent of jobCategoryTree) {
      const count = filterJobsForCityCategory(publishedJobs, city.name, getJobCategoryIdsUnderParent(parent)).length;
      if (getArchiveRobots(count).index) {
        jobCityCategoryRoutes.push({
          url: `${siteUrl}/jobs/city/${city.slug}/${parent.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }
  }

  return [
    ...staticRoutes,
    ...serviceRoutes,
    ...blogRoutes,
    ...blogCategoryRoutes,
    ...blogSubcategoryRoutes,
    ...articleRoutes,
    ...businessRoutes,
    ...cityRoutes,
    ...cityCategoryRoutes,
    ...businessCategoryRoutes,
    ...businessSubcategoryRoutes,
    ...legalRoutes,
    ...jobRoutes,
    ...jobCityRoutes,
    ...jobCityCategoryRoutes,
    ...jobCategoryParentRoutes,
    ...jobCategoryChildRoutes,
  ];
}
