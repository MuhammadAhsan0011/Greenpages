import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { posts, getAllParents as getAllBlogParents, getAllChildren as getAllBlogChildren, normalizeDbArticle } from "../../data/blog";
import { getNamesUnderParent } from "@/lib/taxonomy";
import { PK_CITIES } from "../../data/directoryCities";
import { getAllParents as getAllBusinessParents, getAllChildren as getAllBusinessChildren } from "../../data/businessCategories";
import {
  filterForParent,
  filterForChild,
  filterForCity,
  filterForCityParent,
} from "@/lib/seo/businessListings";
import { getPublishedPostsForCategoryNames } from "@/lib/seo/blogContent";
import { getArchiveRobots, INDEXING_THRESHOLD } from "@/lib/seo/indexing";

export const metadata = {
  title: "SEO Indexing Status",
  robots: { index: false, follow: false },
};

// Same live-count aggregation the sitemap uses (2 Supabase queries total),
// so what this page shows is guaranteed to match what the sitemap and each
// page's own robots tag actually did — not a second, driftable computation.
function StatusBadge({ count }) {
  const { index } = getArchiveRobots(count);
  return (
    <span style={{ color: index ? "#1a7f37" : "#b42318", fontWeight: 600 }}>
      {index ? "Index" : "Noindex"}
    </span>
  );
}

function SectionTable({ title, rows }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
        {title} ({rows.length})
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: "6px 8px" }}>Name</th>
            <th style={{ padding: "6px 8px" }}>URL</th>
            <th style={{ padding: "6px 8px" }}>Live count</th>
            <th style={{ padding: "6px 8px" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "6px 8px" }}>{row.name}</td>
              <td style={{ padding: "6px 8px" }}>
                <Link href={row.path}>{row.path}</Link>
              </td>
              <td style={{ padding: "6px 8px" }}>{row.count}</td>
              <td style={{ padding: "6px 8px" }}>
                <StatusBadge count={row.count} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminSeoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/");
  }

  const [{ data: businessRows }, { data: articleRows }] = await Promise.all([
    supabase.from("businesses").select("category, subcategory, city, needs_review"),
    supabase
      .from("articles")
      .select("category, published_at, approved, content")
      .eq("approved", true)
      .lte("published_at", new Date().toISOString()),
  ]);

  const businesses = businessRows ?? [];
  const normalizedArticles = (articleRows ?? []).map(normalizeDbArticle);

  const directoryParents = getAllBusinessParents().map((parent) => ({
    name: parent.name,
    path: `/businesses/category/${parent.slug}`,
    count: filterForParent(businesses, parent.name).length,
  }));

  const directoryChildren = getAllBusinessChildren().map((child) => ({
    name: `${child.parentName} / ${child.name}`,
    path: `/businesses/category/${child.parentSlug}/${child.slug}`,
    count: filterForChild(businesses, child.parentName, child.name).length,
  }));

  const blogParents = getAllBlogParents().map((parent) => ({
    name: parent.name,
    path: `/blog/category/${parent.slug}`,
    count: getPublishedPostsForCategoryNames(getNamesUnderParent(parent), posts, normalizedArticles).length,
  }));

  const blogChildren = getAllBlogChildren().map((child) => ({
    name: `${child.parentName} / ${child.name}`,
    path: `/blog/category/${child.parentSlug}/${child.slug}`,
    count: getPublishedPostsForCategoryNames([child.name], posts, normalizedArticles).length,
  }));

  const cities = PK_CITIES.map((city) => ({
    name: city.name,
    path: `/businesses/city/${city.slug}`,
    count: filterForCity(businesses, city.name).length,
  }));

  const cityCategories = PK_CITIES.flatMap((city) =>
    getAllBusinessParents().map((parent) => ({
      name: `${parent.name} in ${city.name}`,
      path: `/businesses/city/${city.slug}/${parent.slug}`,
      count: filterForCityParent(businesses, city.name, parent.name).length,
    }))
  );

  const allRows = [...directoryParents, ...directoryChildren, ...blogParents, ...blogChildren, ...cities, ...cityCategories];
  const indexedCount = allRows.filter((r) => getArchiveRobots(r.count).index).length;

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <h1>SEO Indexing Status</h1>
      <p>
        Live counts from Supabase, evaluated against{" "}
        <code>INDEXING_THRESHOLD = {INDEXING_THRESHOLD}</code>. {indexedCount} of {allRows.length} archive pages
        currently qualify for indexing.
      </p>

      <SectionTable title="Directory — Parent Categories" rows={directoryParents} />
      <SectionTable title="Directory — Child Categories" rows={directoryChildren} />
      <SectionTable title="Blog — Parent Categories" rows={blogParents} />
      <SectionTable title="Blog — Child Categories" rows={blogChildren} />
      <SectionTable title="Cities" rows={cities} />
      <SectionTable title="City × Category" rows={cityCategories} />
    </div>
  );
}
