"use client";

// This MUST be a Client Component — the footer lives in the root layout,
// which never receives searchParams as a prop (only pages do), so the
// "subscribed" success state has to be read via useSearchParams() instead,
// which works from any Client Component regardless of nesting. Submitting
// the form itself is still a plain Server Action, no fetch needed.

import { useSearchParams } from "next/navigation";
import { subscribeToNewsletter } from "../actions/newsletter";

export default function NewsletterForm() {
  const searchParams = useSearchParams();
  const subscribed = searchParams.get("subscribed") === "1";

  if (subscribed) {
    return <p className="footer-newsletter-success">Thanks for subscribing!</p>;
  }

  return (
    <form action={subscribeToNewsletter} className="footer-newsletter-form">
      <label htmlFor="newsletter-email" className="visually-hidden">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        placeholder="Enter your email"
        required
      />
      <button type="submit" aria-label="Subscribe">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12h16M13 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </form>
  );
}
