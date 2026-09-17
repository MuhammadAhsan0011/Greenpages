import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../../components/Button";
import BusinessCard from "../../../../components/BusinessCard";
import Breadcrumbs from "../../../../components/Breadcrumbs";
import { createPublicClient } from "@/utils/supabase/public";
import { getAllParents, getParent, getChild } from "../../../../data/businessCategories";
import { filterForChild } from "@/lib/seo/businessListings";
import { getArchiveRobots } from "@/lib/seo/indexing";
import { buildCollectionPageSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

// Pre-renders one page per child category at build time.
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

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("category", parent.name)
    .eq("subcategory", child.name);
  const businesses = filterForChild(data ?? [], parent.name, child.name);

  const title = child.metaTitle || `${child.name} in Pakistan | Green Pages`;
  const description =
    child.metaDescription ||
    `Find verified ${child.name} businesses across Pakistan on Green Pages — search by city, or list your own business free.`.slice(
      0,
      155
    );

  return {
    title,
    description,
    alternates: {
      canonical: `/businesses/category/${parent.slug}/${child.slug}`,
    },
    robots: getArchiveRobots(businesses.length),
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/businesses/category/${parent.slug}/${child.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// Server Component — a directory landing page scoped to one child category.
export default async function ChildCategoryDirectoryPage({ params }) {
  const { parent: parentSlug, child: childSlug } = await params;
  const parent = getParent(parentSlug);
  const child = parent ? getChild(parentSlug, childSlug) : null;

  if (!parent || !child) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("category", parent.name)
    .eq("subcategory", child.name);

  const businesses = filterForChild(data ?? [], parent.name, child.name).sort((a, b) => {
    const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
    if (planDiff !== 0) return planDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const siblingCategories = parent.children.filter((c) => c.slug !== child.slug);

  const collectionSchema = buildCollectionPageSchema(
    {
      name: `${child.name} in Pakistan`,
      description: child.description || undefined,
      path: `/businesses/category/${parent.slug}/${child.slug}`,
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

      <section className="hero">
        <div className="container">
          <Breadcrumbs
            items={[
              { name: "Business Directory", path: "/businesses" },
              { name: parent.name, path: `/businesses/category/${parent.slug}` },
              { name: child.name },
            ]}
          />
          <span className="hero-eyebrow">Business Directory</span>
          <h1>{child.name} in Pakistan</h1>
          {child.description && <p className="hero-description">{child.description}</p>}
          <div className="hero-ctas">
            <Button href="/signup" variant="secondary">
              List Your Business Free
            </Button>
            <Button href={`/businesses/category/${parent.slug}`} variant="secondary">
              Browse All {parent.name}
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            {child.name} Businesses
          </h2>
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <BusinessCard business={business} key={business.id} />
              ))}
            </div>
          ) : (
            <p>
              No {child.name} businesses listed yet.{" "}
              <Link href="/signup">Be the first to add yours.</Link>
            </p>
          )}
        </div>
      </section>

      {businesses.length > 0 && siblingCategories.length > 0 && (
        <section className="section-alt" aria-labelledby="other-categories-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">More in {parent.name}</span>
              <h2 id="other-categories-heading">Browse Related Categories</h2>
            </div>
            <nav className="directory-browse-links" aria-label="Related categories">
              {siblingCategories.map((sibling) => (
                <Link href={`/businesses/category/${parent.slug}/${sibling.slug}`} key={sibling.slug}>
                  {sibling.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}
    </>
  );
}
