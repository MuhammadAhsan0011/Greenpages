import Image from "next/image";
import Link from "next/link";

// Server Component — shared listing card used by the main directory,
// city pages, and category pages, so all three stay visually consistent.
export default function BusinessCard({ business }) {
  return (
    <article className="business-card">
      {business.logo_url && (
        <div className="business-card-logo">
          <Image
            src={business.logo_url}
            alt={`${business.name} logo`}
            width={56}
            height={56}
          />
        </div>
      )}
      {business.plan !== "free" && (
        <span className={`plan-badge plan-badge-${business.plan}`}>
          {business.plan === "featured" ? "★ Gold" : "✓ Silver"}
        </span>
      )}
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
