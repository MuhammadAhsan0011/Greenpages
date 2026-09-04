import Image from "next/image";
import Link from "next/link";
import PlanBadge from "./PlanBadge";

// Server Component — a photo-forward card used only by the homepage's
// "Featured Businesses" section (see FEATURED_CATEGORY_SLUGS / the
// directory's BusinessCard.js is the shared card used everywhere else and
// is intentionally left alone until the Directory pages get their own
// redesign pass).
export default function FeaturedBusinessCard({ business, rating }) {
  const avgRating = rating ? rating.total / rating.count : null;

  return (
    <article className="featured-business-card">
      <div className="featured-business-photo">
        {business.logo_url ? (
          <Image
            src={business.logo_url}
            alt={`${business.name} logo`}
            fill
            sizes="(max-width: 700px) 100vw, 320px"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="featured-business-photo-placeholder" aria-hidden="true">
            🏢
          </div>
        )}
        <PlanBadge plan={business.plan} className="featured-business-badge" />
      </div>
      <div className="featured-business-body">
        <h3>
          <Link href={`/businesses/${business.id}`}>{business.name}</Link>
        </h3>
        <p className="featured-business-meta">
          <span>{business.category}</span>
          {business.city && <span>· {business.city}</span>}
        </p>
        {avgRating !== null && (
          <p className="featured-business-rating">
            <span aria-hidden="true">★</span> {avgRating.toFixed(1)} ({rating.count})
          </p>
        )}
        <Link href={`/businesses/${business.id}`} className="service-link">
          View Profile →
        </Link>
      </div>
    </article>
  );
}
