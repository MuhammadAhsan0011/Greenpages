import Image from "next/image";
import Link from "next/link";
import NoPhotoPlaceholder from "./NoPhotoPlaceholder";
import PlanBadge from "./PlanBadge";

// Server Component — the horizontal listing row used on /businesses. This
// is deliberately a separate component from BusinessCard.js (the vertical
// grid card used on city/category pages), matching the different layout
// the Directory page's reference design calls for.
export default function DirectoryListItem({ business, rating }) {
  const avgRating = rating ? rating.total / rating.count : null;
  const photo = business.cover_image_url || business.logo_url;

  return (
    <article className="directory-list-item">
      <div className="directory-list-photo">
        {photo ? (
          <Image src={photo} alt={`${business.name} photo`} fill sizes="140px" style={{ objectFit: "cover" }} />
        ) : (
          <NoPhotoPlaceholder />
        )}
      </div>
      <div className="directory-list-body">
        <h3>
          <Link href={`/businesses/${business.id}`}>{business.name}</Link>
          <PlanBadge plan={business.plan} iconOnly />
        </h3>
        <div className="directory-list-meta">
          <span>{business.category}</span>
          {business.city && <span>📍 {business.city}</span>}
        </div>
        {avgRating !== null && (
          <div className="directory-list-rating">
            <span className="review-stars" aria-hidden="true">
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))}
            </span>
            <span>
              {avgRating.toFixed(1)} ({rating.count})
            </span>
          </div>
        )}
      </div>
      <div className="directory-list-actions">
        <Link href={`/businesses/${business.id}`} className="btn btn-secondary btn-sm">
          View Details
        </Link>
      </div>
    </article>
  );
}
