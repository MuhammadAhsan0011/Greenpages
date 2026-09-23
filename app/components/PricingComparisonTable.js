import { PLAN_LABELS, PLAN_TAGLINE, PHOTO_LIMITS } from "../data/plans";

const ROWS = [
  { label: "Price", free: "Rs. 0", verified: "Rs. 2,000 one-time", featured: "Rs. 4,500 one-time" },
  { label: "Directory listing", free: true, verified: true, featured: true },
  { label: "Business logo", free: true, verified: true, featured: true },
  {
    label: "Gallery photos",
    free: `${PHOTO_LIMITS.free} photo`,
    verified: `${PHOTO_LIMITS.verified} photos`,
    featured: `${PHOTO_LIMITS.featured} photos`,
  },
  { label: "Cover image", free: false, verified: true, featured: true },
  { label: "“Verified” badge", free: false, verified: true, featured: false },
  { label: "“Premium” badge", free: false, verified: false, featured: true },
  { label: "Social media links", free: false, verified: true, featured: true },
  { label: "Rich “About” editor", free: false, verified: true, featured: true },
  { label: "Dofollow website link", free: false, verified: true, featured: true },
  { label: "Priority placement in search & category results", free: false, verified: true, featured: true },
  { label: "Top placement directory-wide", free: false, verified: false, featured: true },
  { label: "Featured on homepage", free: false, verified: false, featured: true },
  { label: "Comment on articles", free: true, verified: true, featured: true },
  { label: "Dedicated onboarding support", free: false, verified: false, featured: true },
];

function Cell({ value }) {
  if (value === true) {
    return (
      <span className="pricing-comparison-yes" aria-label="Included">
        ✓
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="pricing-comparison-no" aria-label="Not included">
        —
      </span>
    );
  }
  return value;
}

// Server Component — a static, data-driven comparison table below the
// pricing cards so the practical difference between plans is scannable at
// a glance instead of only living inside each card's own bullet list.
export default function PricingComparisonTable() {
  return (
    <div className="pricing-comparison-wrap">
      <table className="pricing-comparison-table">
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">
              <span className="pricing-comparison-plan-name">{PLAN_LABELS.free}</span>
              <span className="pricing-comparison-plan-tagline">{PLAN_TAGLINE.free}</span>
            </th>
            <th scope="col" className="pricing-comparison-col-verified">
              <span className="pricing-comparison-plan-name">{PLAN_LABELS.verified}</span>
              <span className="pricing-comparison-plan-tagline">{PLAN_TAGLINE.verified}</span>
            </th>
            <th scope="col">
              <span className="pricing-comparison-plan-name">{PLAN_LABELS.featured}</span>
              <span className="pricing-comparison-plan-tagline">{PLAN_TAGLINE.featured}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>
                <Cell value={row.free} />
              </td>
              <td className="pricing-comparison-col-verified">
                <Cell value={row.verified} />
              </td>
              <td>
                <Cell value={row.featured} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
