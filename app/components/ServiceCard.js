import Link from "next/link";

// Server Component — renders static content driven entirely by props,
// so it never needs client-side JavaScript.
export default function ServiceCard({ service }) {
  const { slug, title, shortDescription, icon } = service;

  return (
    <article className="service-card">
      <span className="service-icon" aria-hidden="true">
        {icon}
      </span>
      <h3>
        <Link href={`/services/${slug}`}>{title}</Link>
      </h3>
      <p>{shortDescription}</p>
      <Link href={`/services/${slug}`} className="service-link">
        Learn more →
      </Link>
    </article>
  );
}
