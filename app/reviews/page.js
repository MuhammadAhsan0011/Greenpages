import ReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import { createPublicClient } from "@/utils/supabase/public";

export const metadata = {
  title: "Reviews",
  description:
    "Read what businesses and customers say about Green Pages, or leave your own review.",
  alternates: { canonical: "/reviews" },
};

export const revalidate = 60;

// Server Component — platform-wide reviews (business_id is null). Reviews
// tied to a specific business live on that business's own listing page
// instead (see app/businesses/[id]/page.js).
export default async function ReviewsPage({ searchParams }) {
  const params = await searchParams;
  const reviewed = params?.reviewed;
  const reviewError = params?.reviewError;

  const supabase = createPublicClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, reviewer_name, rating, message, created_at")
    .is("business_id", null)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  const list = reviews ?? [];
  const averageRating = list.length
    ? (list.reduce((sum, review) => sum + review.rating, 0) / list.length).toFixed(1)
    : null;

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Reviews</span>
          <h1>What People Say About Green Pages</h1>
          <p className="hero-description">
            {averageRating
              ? `Rated ${averageRating} out of 5 from ${list.length} review${
                  list.length === 1 ? "" : "s"
                }.`
              : "Be the first to share your experience with Green Pages."}
          </p>
        </div>
      </section>

      <section aria-labelledby="reviews-heading">
        <div className="container">
          <h2 id="reviews-heading" className="visually-hidden">
            Reviews
          </h2>
          <ReviewList reviews={list} />
        </div>
      </section>

      <section className="section-alt" aria-labelledby="write-review-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Share Your Experience</span>
            <h2 id="write-review-heading">Write a Review</h2>
          </div>

          {reviewed && (
            <p className="form-success">
              Thanks for your review! It&apos;ll appear here once our team
              approves it.
            </p>
          )}
          {reviewError && <p className="form-error">{reviewError}</p>}

          <ReviewForm redirectTo="/reviews" />
        </div>
      </section>
    </>
  );
}
