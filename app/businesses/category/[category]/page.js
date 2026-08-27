import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../../components/Button";
import BusinessCard from "../../../components/BusinessCard";
import { createPublicClient } from "@/utils/supabase/public";
import { BUSINESS_CATEGORIES, getCategoryBySlug } from "../../../data/businessCategories";

export const revalidate = 60;

// Pre-renders one page per known business category at build time.
export async function generateStaticParams() {
  return BUSINESS_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${category.name} Businesses in Pakistan`,
    description:
      `Find verified ${category.name} businesses across Pakistan on Green Pages — search by city, or list your own business free.`.slice(
        0,
        160
      ),
    alternates: {
      canonical: `/businesses/category/${category.slug}`,
    },
  };
}

const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// Server Component — a directory landing page scoped to one business
// category, with its own unique intro copy (see data/businessCategories.js)
// so it reads as a real page rather than a templated find-and-replace.
export default async function CategoryDirectoryPage({ params }) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .eq("category", category.name);

  const businesses = (data ?? []).sort((a, b) => {
    const planDiff = (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2);
    if (planDiff !== 0) return planDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const otherCategories = BUSINESS_CATEGORIES.filter((c) => c.slug !== category.slug);

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/businesses">Business Directory</Link> / {category.name}
          </p>
          <span className="hero-eyebrow">Business Directory</span>
          <h1>{category.name} Businesses in Pakistan</h1>
          <p className="hero-description">{category.intro}</p>
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

      <section aria-labelledby="listings-heading">
        <div className="container">
          <h2 id="listings-heading" className="visually-hidden">
            {category.name} Businesses
          </h2>
          {businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <BusinessCard business={business} key={business.id} />
              ))}
            </div>
          ) : (
            <p>
              No {category.name} businesses listed yet.{" "}
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
            {otherCategories.map((otherCategory) => (
              <Link
                href={`/businesses/category/${otherCategory.slug}`}
                key={otherCategory.slug}
              >
                {otherCategory.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
