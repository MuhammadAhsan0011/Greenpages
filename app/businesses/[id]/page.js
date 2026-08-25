import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../components/Button";
import { createPublicClient } from "@/utils/supabase/public";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, category, description, city")
    .eq("id", id)
    .maybeSingle();

  if (!business) {
    return { title: "Business Not Found" };
  }

  return {
    title: business.name,
    description: `${business.name} — ${business.category}${
      business.city ? ` in ${business.city}` : ""
    }. ${business.description}`.slice(0, 160),
    alternates: {
      canonical: `/businesses/${id}`,
    },
  };
}

// Server Component — public business profile with an Overview section and
// an Articles section by the same owner. Both render in full on the page
// (no client-side tab switching) so every part stays crawlable.
export default async function BusinessProfilePage({ params }) {
  const { id } = await params;
  const supabase = createPublicClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*, profiles(full_name)")
    .eq("id", id)
    .maybeSingle();

  if (!business) {
    notFound();
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, title, excerpt, category, created_at")
    .eq("author_id", business.owner_id)
    .order("created_at", { ascending: false });

  return (
    <>
      <section className="service-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/businesses">Business Directory</Link> / {business.name}
          </p>
          <span className="category-badge">{business.category}</span>
          {business.plan !== "free" && (
            <span className={`plan-badge plan-badge-${business.plan}`}>
              {business.plan === "featured" ? "★ Featured" : "✓ Verified"}
            </span>
          )}
          <h1>{business.name}</h1>
          <div className="post-meta">
            {business.city && <span>{business.city}</span>}
            <span aria-hidden="true">·</span>
            <span>Listed by {business.profiles?.full_name ?? "Member"}</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="profile-tabs-heading">
        <div className="container">
          <h2 id="profile-tabs-heading" className="visually-hidden">
            Business Profile Sections
          </h2>
          <nav className="profile-tabs" aria-label="Profile sections">
            <a href="#overview">Overview</a>
            <a href="#articles">Articles ({articles?.length ?? 0})</a>
          </nav>

          <article id="overview" className="service-section">
            <h2>Overview</h2>
            <p>{business.description}</p>
            <dl className="sidebar-meta">
              {business.website && (
                <div>
                  <dt>Website</dt>
                  <dd>
                    <a
                      href={business.website}
                      className="website-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {business.website}
                    </a>
                  </dd>
                </div>
              )}
              {business.phone && (
                <div>
                  <dt>Phone</dt>
                  <dd>{business.phone}</dd>
                </div>
              )}
            </dl>
          </article>

          <article id="articles" className="service-section">
            <h2>Articles by {business.profiles?.full_name ?? "this member"}</h2>
            {articles && articles.length > 0 ? (
              <ul className="account-article-list">
                {articles.map((article) => (
                  <li key={article.slug} className="account-article-item">
                    <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                    <p>{article.excerpt}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No articles published yet.</p>
            )}
          </article>
        </div>
      </section>

      <section aria-labelledby="business-cta-heading">
        <div className="container">
          <div className="cta-banner">
            <h2 id="business-cta-heading">List Your Own Business Free</h2>
            <p>Join the directory and start publishing articles today.</p>
            <div className="cta-actions">
              <Button href="/signup" variant="inverted">
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
