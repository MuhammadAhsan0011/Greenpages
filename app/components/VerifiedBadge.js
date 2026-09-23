// "Verified" means Green Pages admin has reviewed/approved this specific
// job — never conflated with "Featured" (promotional visibility), per the
// spec's explicit rule. Deliberately plain and understated (a green
// checkmark pill) so it never reads as a paid-advertising badge.
export default function VerifiedBadge({ className = "" }) {
  return (
    <span className={`verified-badge ${className}`.trim()}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m5 12.5 4.2 4.2L19 7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Green Pages Verified
    </span>
  );
}
