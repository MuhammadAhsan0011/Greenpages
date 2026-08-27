// Server Component — purely presentational, driven by props.
export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return <p>No reviews yet.</p>;
  }

  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <li className="review-item" key={review.id}>
          <div className="review-item-header">
            <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </span>
            <span className="review-author">{review.reviewer_name}</span>
          </div>
          <p>{review.message}</p>
          <span className="review-date">
            {new Date(review.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
