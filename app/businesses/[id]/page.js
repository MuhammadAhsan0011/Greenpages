import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "../../components/Button";
import ReviewForm from "../../components/ReviewForm";
import ReviewList from "../../components/ReviewList";
import ShareButton from "../../components/ShareButton";
import SanitizedArticleBody from "../../components/SanitizedArticleBody";
import NoPhotoPlaceholder from "../../components/NoPhotoPlaceholder";
import BusinessCard from "../../components/BusinessCard";
import PlanBadge from "../../components/PlanBadge";
import GallerySlider from "../../components/GallerySlider";
import { createPublicClient } from "@/utils/supabase/public";
import { BUSINESS_CATEGORIES } from "../../data/businessCategories";

export const revalidate = 60;

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

// "14:30" -> "2:30 PM". Falls back to the raw string for anything that
// doesn't parse as a plain HH:MM (native <input type="time"> always
// produces one, so this is just a safety net).
function formatHourTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  if (!match) return value;
  const hour24 = Number(match[1]);
  const minute = match[2];
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${period}`;
}

// Every business on this site is in Pakistan, so "today"/"now" always
// mean Pakistan Time — using the server's own timezone (UTC on Vercel)
// would show the wrong day/status for a large chunk of the day.
function getKarachiNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const weekday = parts.find((p) => p.type === "weekday").value.toLowerCase();
  const hour = Number(parts.find((p) => p.type === "hour").value);
  const minute = Number(parts.find((p) => p.type === "minute").value);
  return { weekday, minutes: hour * 60 + minute };
}

// Same-day ranges only (e.g. "12:00 PM – 12:00 AM") — a close time past
// midnight is treated as the end of today rather than modeling a true
// overnight span into tomorrow.
function isOpenNow(hoursToday, nowMinutes) {
  if (!hoursToday || hoursToday.closed || !hoursToday.open || !hoursToday.close) return false;
  const [oh, om] = hoursToday.open.split(":").map(Number);
  const [ch, cm] = hoursToday.close.split(":").map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch === 0 && cm === 0 ? 24 * 60 : ch * 60 + cm;
  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}

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

const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

// Server Component — public business profile. The Overview / Photos /
// Reviews tabs are a pure-CSS radio-button widget (see .profile-tab-* in
// globals.css, shared with the business-edit wizard's own tabs but using
// distinct IDs), so switching tabs needs no client-side JavaScript.
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

  // Best-effort — a public visitor has no write access under RLS, so this
  // goes through a security-definer function scoped to just this one
  // increment (see supabase/schema.sql). Never blocks rendering if it fails.
  await supabase.rpc("increment_business_view", { business_id: business.id });

  const isPaidPlan = business.plan === "verified" || business.plan === "featured";

  const [{ data: articles }, { data: relatedRaw }, { data: reviewData }] = await Promise.all([
    supabase
      .from("articles")
      .select("slug, title, excerpt, category, created_at")
      .eq("author_id", business.owner_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("businesses")
      .select("*")
      .eq("category", business.category)
      .neq("id", business.id)
      .limit(4),
    supabase
      .from("reviews")
      .select("id, reviewer_name, rating, message, created_at")
      .eq("business_id", business.id)
      .eq("approved", true)
      .order("created_at", { ascending: false }),
  ]);

  const reviews = reviewData ?? [];

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : null;

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  const categorySlug = BUSINESS_CATEGORIES.find((c) => c.name === business.category)?.slug;

  const addressParts = [
    business.address_line1,
    business.address_line2,
    business.city,
    business.state,
    business.postal_code,
    business.country,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  const socialLinks = [
    {
      label: "Facebook",
      url: business.facebook_url,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14 9h2.5V6h-2.5c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h2.5l.5-3H13v-2c0-.6.4-1 1-1Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      label: "Instagram",
      url: business.instagram_url,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      url: business.linkedin_url,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="9" width="3" height="10" fill="currentColor" />
          <circle cx="6.5" cy="5.5" r="1.8" fill="currentColor" />
          <path
            d="M11 9h3v1.6c.6-1 1.7-1.8 3.3-1.8 2.5 0 3.7 1.7 3.7 4.6V19h-3v-5.2c0-1.4-.5-2.4-1.8-2.4-1 0-1.6.7-1.9 1.3-.1.2-.1.6-.1 1V19h-3V9Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      label: "WhatsApp",
      url: business.whatsapp_url,
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.5.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.5-.9-2-.2-.6-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.2.9 2.4 1 2.6.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2-.1-.2-.3-.2-.5-.3Z"
          />
          <path
            fill="currentColor"
            d="M12 2.5A9.5 9.5 0 0 0 3.4 16.4L2.5 21.5l5.2-1.4A9.5 9.5 0 1 0 12 2.5Zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.8 7.8 0 1 1 12 19.8Z"
          />
        </svg>
      ),
    },
  ].filter((link) => link.url);

  const featureList = (business.features ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const tagList = (business.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const galleryImages = (business.photos ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
  const { weekday: todayKey, minutes: nowMinutes } = getKarachiNow();
  const hoursToday = business.business_hours?.[todayKey];
  const openNow = isOpenNow(hoursToday, nowMinutes);

  const relatedBusinesses = (relatedRaw ?? [])
    .sort((a, b) => (PLAN_RANK[a.plan] ?? 2) - (PLAN_RANK[b.plan] ?? 2))
    .slice(0, 4);

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

      <section className="listing-header">
        <div className="container">
          <p className="breadcrumbs">
            <Link href="/">Home</Link> / <Link href="/businesses">Directory</Link>
            {categorySlug && (
              <>
                {" "}
                / <Link href={`/businesses/category/${categorySlug}`}>{business.category}</Link>
              </>
            )}{" "}
            / {business.name}
          </p>

          <div className="listing-header-grid">
            <div className="listing-header-info">
              <div className="listing-header-top">
                <div className="business-hero-logo">
                  {business.logo_url ? (
                    <Image src={business.logo_url} alt={`${business.name} logo`} width={72} height={72} />
                  ) : (
                    <NoPhotoPlaceholder />
                  )}
                </div>
                <div>
                  <h1>
                    {business.name}
                    <PlanBadge plan={business.plan} className="listing-plan-badge" iconOnly />
                  </h1>
                  <div className="listing-rating-row">
                    {averageRating && (
                      <>
                        <span className="listing-rating-value">{averageRating.toFixed(1)}</span>
                        <span className="review-stars" aria-hidden="true">
                          {"★".repeat(Math.round(averageRating))}
                          {"☆".repeat(5 - Math.round(averageRating))}
                        </span>
                        <span>({reviews.length} Reviews)</span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span>{business.view_count ?? 0} Views</span>
                  </div>
                </div>
              </div>

              <div className="listing-badges">
                <span className="category-badge">{business.category}</span>
                {business.city && <span className="listing-location">📍 {fullAddress || business.city}</span>}
              </div>

              <div className="listing-actions">
                {(business.phone || business.whatsapp_url) && (
                  <a
                    href={business.phone ? `tel:${business.phone}` : business.whatsapp_url}
                    className="btn btn-primary"
                  >
                    Contact Now
                  </a>
                )}
                {business.website && (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                    Website
                  </a>
                )}
                <ShareButton title={business.name} />
              </div>

              {socialLinks.length > 0 && (
                <div className="listing-social-icons">
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${business.name} on ${link.label}`}
                      title={link.label}
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="listing-gallery">
              {galleryImages.length > 0 ? (
                <GallerySlider images={galleryImages} alt={`${business.name} photo`} />
              ) : (
                <div className="listing-gallery-main listing-gallery-empty">
                  <NoPhotoPlaceholder showLabel />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="profile-tabs-heading">
        <div className="container">
          <h2 id="profile-tabs-heading" className="visually-hidden">
            Business Profile Sections
          </h2>

          <input type="radio" name="detailTab" id="detail-tab-overview" className="profile-tab-radio" defaultChecked />
          <input type="radio" name="detailTab" id="detail-tab-photos" className="profile-tab-radio" />
          <input type="radio" name="detailTab" id="detail-tab-reviews" className="profile-tab-radio" />
          <input type="radio" name="detailTab" id="detail-tab-articles" className="profile-tab-radio" />

          <div className="profile-tab-bar" role="tablist">
            <label htmlFor="detail-tab-overview">Overview</label>
            <label htmlFor="detail-tab-photos">Photos ({galleryImages.length})</label>
            <label htmlFor="detail-tab-reviews">Reviews ({reviews.length})</label>
            <label htmlFor="detail-tab-articles">Articles ({articles?.length ?? 0})</label>
          </div>

          <div className="listing-layout">
            <div className="listing-main">
              <div className="profile-tab-panel" id="panel-detail-overview">
                <h2>About This Business</h2>
                {business.about_html ? (
                  <SanitizedArticleBody html={business.about_html} />
                ) : (
                  <p>{business.description}</p>
                )}

                {featureList.length > 0 && (
                  <>
                    <h3>Features</h3>
                    <div className="tag-list">
                      {featureList.map((feature) => (
                        <span className="feature-badge" key={feature}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {tagList.length > 0 && (
                  <>
                    <h3>Services &amp; Specialties</h3>
                    <div className="tag-list">
                      {tagList.map((tag) => (
                        <span className="feature-badge" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {business.business_hours && (
                  <>
                    <h3>Business Hours</h3>
                    <table className="hours-table">
                      <tbody>
                        {DAYS.map((day) => {
                          const info = business.business_hours[day.key];
                          if (!info) return null;
                          return (
                            <tr key={day.key} className={day.key === todayKey ? "hours-row-today" : ""}>
                              <td>{day.label}</td>
                              <td>
                                {info.closed
                                  ? "Closed"
                                  : `${formatHourTime(info.open)} – ${formatHourTime(info.close)}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}

              </div>

              <div className="profile-tab-panel" id="panel-detail-photos">
                <h2>Photos</h2>
                {galleryImages.length > 0 ? (
                  <div className="listing-photo-grid">
                    {galleryImages.map((src) => (
                      <div className="listing-photo-grid-item" key={src}>
                        <Image src={src} alt={`${business.name} photo`} fill sizes="240px" style={{ objectFit: "cover" }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No photos yet.</p>
                )}
              </div>

              <div className="profile-tab-panel" id="panel-detail-reviews">
                <h2>What Customers Say</h2>
                {averageRating ? (
                  <div className="rating-breakdown">
                    <div className="rating-breakdown-summary">
                      <span className="rating-breakdown-value">{averageRating.toFixed(1)}</span>
                      <span className="review-stars" aria-hidden="true">
                        {"★".repeat(Math.round(averageRating))}
                        {"☆".repeat(5 - Math.round(averageRating))}
                      </span>
                      <span>Based on {reviews.length} reviews</span>
                    </div>
                    <div className="rating-breakdown-bars">
                      {ratingCounts.map(({ stars, count }) => (
                        <div className="rating-bar-row" key={stars}>
                          <span>{stars}★</span>
                          <span className="rating-bar-track">
                            <span
                              className="rating-bar-fill"
                              style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }}
                            />
                          </span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>No reviews yet — be the first to leave one.</p>
                )}
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
              </div>

              <div className="profile-tab-panel" id="panel-detail-articles">
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
              </div>
            </div>

            <aside className="wizard-sidebar">
              <div className="wizard-sidebar-card">
                <h3>Contact Information</h3>
                <ul className="listing-contact-list">
                  {business.phone && <li>📞 {business.phone}</li>}
                  {business.website && (
                    <li>
                      🌐{" "}
                      <a href={business.website} target="_blank" rel="noopener noreferrer">
                        {business.website}
                      </a>
                    </li>
                  )}
                  {hoursToday && (
                    <li>
                      🕐{" "}
                      {hoursToday.closed ? (
                        "Closed today"
                      ) : openNow ? (
                        <>
                          <span className="listing-open-badge">Open Now</span> · Closes at{" "}
                          {formatHourTime(hoursToday.close)}
                        </>
                      ) : (
                        <>
                          <span className="listing-closed-badge">Closed Now</span> · Opens at{" "}
                          {formatHourTime(hoursToday.open)}
                        </>
                      )}
                    </li>
                  )}
                </ul>
              </div>

              {fullAddress && (
                <div className="wizard-sidebar-card">
                  <h3>Address</h3>
                  <p>{fullAddress}</p>
                  <div className="listing-map">
                    <iframe
                      title={`Map showing ${business.name}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${business.name}, ${fullAddress}`
                      )}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    Get Directions →
                  </a>
                </div>
              )}

              <div className="wizard-sidebar-card">
                <h3>Business Details</h3>
                <dl className="sidebar-meta">
                  <div>
                    <dt>Listed On</dt>
                    <dd>
                      {new Date(business.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt>Plan</dt>
                    <dd>{business.plan === "featured" ? "Premium" : business.plan === "verified" ? "Verified" : "Free"}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {relatedBusinesses.length > 0 && (
        <section className="section-alt" aria-labelledby="related-heading">
          <div className="container">
            <div className="section-header">
              <span className="section-eyebrow">Directory</span>
              <h2 id="related-heading">You May Also Like</h2>
            </div>
            <div className="grid grid-3">
              {relatedBusinesses.map((related) => (
                <BusinessCard business={related} key={related.id} />
              ))}
            </div>
          </div>
        </section>
      )}

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
