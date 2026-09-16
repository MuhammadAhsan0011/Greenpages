import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../components/Button";
import BusinessCard from "../../../components/BusinessCard";
import { createPublicClient } from "@/utils/supabase/public";
import { getAllParents, getParent } from "../../../data/businessCategories";
import { BUSINESS_LEGACY_NAMES, namesForParent } from "../../../data/legacyCategoryNames";

export const revalidate = 60;

// Pre-renders one parent-level aggregate page per top-level directory
// category at build time.
export async function generateStaticParams() {
  return getAllParents().map((parent) => ({ parent: parent.slug }));
}

export async function generateMetadata({ params }) {
  const { parent: parentSlug } = await params;
  const parent = getParent(parentSlug);

  if (!parent) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${parent.name} Businesses in Pakistan`,
    description:
      `Find verified ${parent.name} businesses across Pakistan on Green Pages — search by city, or list your own business free.`.slice(
        0,
        160
      ),
    alternates: {
      canonical: `/businesses/category/${parent.slug}`,
    },
  };
}

const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// Server Component — a directory landing page scoped to one parent
// category, aggregating businesses across every one of its children (plus
// any not yet migrated off their old flat category name — see
// legacyCategoryNames.js).
export default async function ParentCategoryDirectoryPage({ params }) {
  const { parent: parentSlug } = await params;
  const parent = getParent(parentSlug);

  if (!parent) {
    notFound();
  }

  const matchNames = namesForParent(BUSINESS_LEGACY_NAMES, parent);

  const supabase = createPublicClient();
  const { data } = await supabase.from("businesses").select("*").in("category", matchNames);

  const businesses = (data ?? [])
    .filter((business) => !business.needs_review)
    .sort((a, b) => {
      const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
      if (planDiff !== 0) return planDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const otherParents = getAllParents().filter((p) => p.slug !== parent.slug);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/businesses">Business Directory</Link> / {parent.name}
          </p>
          <span className="hero-eyebrow">Business Directory</span>
          <h1>{parent.name} Businesses in Pakistan</h1>
          {parent.description && <p className="hero-description">{parent.description}</p>}
          <div className="hero-ctas">
            <Button href="/signup" variant="secondary">
              List Your Business Free
            </Button>
            <Button href="/businesses" variant="secondary">
              Browse All Categories
            </Button>
          </div>
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
                <Link href={`/businesses/category/${parent.slug}/${child.slug}`} key={child.slug}>
                  {child.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            {parent.name} Businesses
          </h2>
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <BusinessCard business={business} key={business.id} />
              ))}
            </div>
          ) : (
            <p>
              No {parent.name} businesses listed yet.{" "}
              <Link href="/signup">Be the first to add yours.</Link>
            </p>
          )}
        </div>
      </section>

      <section className="section-alt" aria-labelledby="other-categories-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Other Categories</span>
            <h2 id="other-categories-heading">Browse Other Categories</h2>
          </div>
          <nav className="directory-browse-links" aria-label="Other categories">
            {otherParents.map((otherParent) => (
              <Link href={`/businesses/category/${otherParent.slug}`} key={otherParent.slug}>
                {otherParent.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
