import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../components/Button";
import ReviewForm from "../../components/ReviewForm";
import ReviewList from "../../components/ReviewList";
import SanitizedArticleBody from "../../components/SanitizedArticleBody";
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
export default async function BusinessProfilePage({ params, searchParams }) {
  const { id } = await params;
  const search = await searchParams;
  const reviewed = search?.reviewed;
  const reviewError = search?.reviewError;
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

  const isFeatured = business.plan === "featured";
  let reviews = [];
  if (isFeatured) {
    const { data } = await supabase
      .from("reviews")
      .select("id, reviewer_name, rating, message, created_at")
      .eq("business_id", business.id)
      .eq("approved", true)
      .order("created_at", { ascending: false });
    reviews = data ?? [];
  }

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  const addressParts = [
    business.address_line1,
    business.address_line2,
    business.city,
    business.state,
    business.postal_code,
    business.country,
  ].filter(Boolean);

  const socialLinks = [
    { label: "Facebook", url: business.facebook_url },
    { label: "Instagram", url: business.instagram_url },
    { label: "LinkedIn", url: business.linkedin_url },
    { label: "WhatsApp", url: business.whatsapp_url },
  ].filter((link) => link.url);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    ...(business.logo_url && { image: business.logo_url }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.website && { url: business.website }),
    address: {
      "@type": "PostalAddress",
      ...(business.city && { addressLocality: business.city }),
      addressCountry: "PK",
    },
    ...(averageRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <section className="service-hero">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/businesses">Business Directory</Link> / {business.name}
          </p>
          {business.logo_url && (
            <div className="business-hero-logo">
              <Image
                src={business.logo_url}
                alt={`${business.name} logo`}
                width={80}
                height={80}
              />
            </div>
          )}
          <span className="category-badge">{business.category}</span>
          {business.plan !== "free" && (
            <span className={`plan-badge plan-badge-${business.plan}`}>
              {business.plan === "featured" ? "★ Gold" : "✓ Silver"}
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
            {business.about_html && <a href="#about">About</a>}
            <a href="#articles">Articles ({articles?.length ?? 0})</a>
            <a href="#reviews">Reviews {isFeatured ? `(${reviews.length})` : ""}</a>
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
              {addressParts.length > 0 && (
                <div>
                  <dt>Address</dt>
                  <dd>{addressParts.join(", ")}</dd>
                </div>
              )}
            </dl>
            {socialLinks.length > 0 && (
              <div className="social-link-list">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </article>

          {business.about_html && (
            <article id="about" className="service-section">
              <h2>About {business.name}</h2>
              <SanitizedArticleBody html={business.about_html} />
            </article>
          )}

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

          <article id="reviews" className="service-section">
            <h2>
              Reviews
              {isFeatured && averageRating
                ? ` — ${averageRating.toFixed(1)} out of 5 (${reviews.length})`
                : ""}
            </h2>
            {isFeatured ? (
              <>
                <ReviewList reviews={reviews} />
                <h3>Write a Review</h3>
                {reviewed && (
                  <p className="form-success">
                    Thanks for your review! It&apos;ll appear here once our
                    team approves it.
                  </p>
                )}
                {reviewError && <p className="form-error">{reviewError}</p>}
                <ReviewForm businessId={business.id} redirectTo={`/businesses/${business.id}`} />
              </>
            ) : (
              <div className="locked-field" title="Upgrade your package to unlock this feature">
                <span className="locked-field-icon" aria-hidden="true">
                  🔒
                </span>
                <span>
                  Customer reviews are a Gold-plan feature — {business.name}{" "}
                  hasn&apos;t unlocked this yet. Businesses can enable reviews by
                  upgrading to the <Link href="/pricing">Gold package</Link>.
                </span>
              </div>
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
