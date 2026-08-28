// Server Component — shown in place of a business logo when the business
// (always a Free-plan business, since logo upload is a paid-only feature)
// hasn't uploaded one, similar to the "no image available" placeholder
// common on e-commerce product listings.
export default function NoPhotoPlaceholder({ showLabel = false }) {
  return (
    <div className="no-photo-placeholder">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="10" r="1.4" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M21 15.5l-5-5-4 4-3-3-6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && <span>No Photo</span>}
    </div>
  );
}
