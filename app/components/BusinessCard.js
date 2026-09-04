import Image from "next/image";
import Link from "next/link";
import NoPhotoPlaceholder from "./NoPhotoPlaceholder";
import PlanBadge from "./PlanBadge";

// Server Component — shared listing card used by the main directory,
// city pages, and category pages, so all three stay visually consistent.
export default function BusinessCard({ business }) {
  return (
    <article className="business-card">
      <div className="business-card-logo">
        {business.logo_url ? (
          <Image
            src={business.logo_url}
            alt={`${business.name} logo`}
            width={56}
            height={56}
          />
        ) : (
          <NoPhotoPlaceholder />
        )}
      </div>
      <PlanBadge plan={business.plan} />
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
  );
}
