import Link from "next/link";
import Button from "../components/Button";
import { createPublicClient } from "@/utils/supabase/public";

export const metadata = {
  title: "Business Directory",
  description:
    "Browse business profiles created by the Green Pages community — free to list your own business.",
  alternates: {
    canonical: "/businesses",
  },
};

// Revalidates every 60 seconds: fresh enough to reflect new sign-ups
// quickly, while still being cached and crawlable like the rest of the site.
export const revalidate = 60;

export default async function BusinessesPage() {
  const supabase = createPublicClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Business Directory</span>
          <h1>Community Business Directory</h1>
          <p className="hero-description">
            Browse businesses listed by the Green Pages community. Sign up
            free to add your own.
          </p>
          <div className="hero-ctas">
            <Button href="/signup" variant="primary">
              List Your Business Free
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="businesses-heading">
        <div className="container">
          <h2 id="businesses-heading" className="visually-hidden">
            All Businesses
          </h2>
          {businesses && businesses.length > 0 ? (
            <div className="grid grid-3">
              {businesses.map((business) => (
                <article className="business-card" key={business.id}>
                  <h3>
                    <Link href={`/businesses/${business.id}`}>{business.name}</Link>
                  </h3>
                  <div className="business-meta">
                    <span>{business.category}</span>
                    {business.city && <span>{business.city}</span>}
                  </div>
                  <p>{business.description}</p>
                  <Link href={`/businesses/${business.id}`} className="service-link">
                    View Profile →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p>
              No businesses listed yet.{" "}
              <Link href="/signup">Be the first to add yours.</Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
