// "Featured" means promoted for extra visibility — a different concept
// from "Verified" (admin-reviewed), so this is deliberately styled
// differently (amber star, not green check) and never appears combined
// into one badge with Verified.
export default function FeaturedBadge({ className = "" }) {
  return (
    <span className={`featured-badge ${className}`.trim()}>
      <span aria-hidden="true">★</span> Featured
    </span>
  );
}
