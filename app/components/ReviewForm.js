import { submitReview } from "../reviews/actions";

const STAR_OPTIONS = [
  { value: "5", label: "★★★★★ Excellent" },
  { value: "4", label: "★★★★☆ Good" },
  { value: "3", label: "★★★☆☆ Average" },
  { value: "2", label: "★★☆☆☆ Poor" },
  { value: "1", label: "★☆☆☆☆ Terrible" },
];

// Server Component — posts directly to the submitReview Server Action, so
// no client-side JavaScript is needed to submit a review. Reused on
// /reviews (businessId omitted) and on a Featured business's listing page
// (businessId passed in).
export default function ReviewForm({ businessId, redirectTo }) {
  return (
    <form action={submitReview} className="contact-form review-form">
      {businessId && <input type="hidden" name="businessId" value={businessId} />}
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <div className="form-field">
        <label htmlFor="reviewerName">Your Name</label>
        <input id="reviewerName" name="reviewerName" type="text" required />
      </div>

      <div className="form-field">
        <label htmlFor="rating">Rating</label>
        <select id="rating" name="rating" defaultValue="5" required>
          {STAR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="message">Your Review</label>
        <textarea id="message" name="message" rows={4} required />
      </div>

      <p className="editor-hint">
        Reviews are checked by our team before they go live, usually within
        a day.
      </p>

      <button type="submit" className="btn btn-primary">
        Submit Review
      </button>
    </form>
  );
}
