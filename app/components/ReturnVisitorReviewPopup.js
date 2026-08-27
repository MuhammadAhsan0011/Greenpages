"use client";

// This MUST be a Client Component — it reads/writes localStorage and runs a
// timer in the browser. Mounted once in the root layout; renders nothing
// until it decides to show the popup, so it never affects initial page
// load or SSR.
//
// Logic: a first-time visitor is just marked as "seen" and gets no popup.
// Only a RETURNING visitor (the marker already exists from a previous
// visit) who then spends 15 minutes on the site during this new visit sees
// the prompt — and only once ever, unless they dismiss it, in which case it
// waits 30 days before asking again.

import { useEffect, useState } from "react";
import { submitReviewInline } from "../reviews/actions";

const VISITED_KEY = "gp_has_visited";
const HANDLED_KEY = "gp_review_handled";
const SNOOZE_KEY = "gp_review_snooze_until";
const PROMPT_DELAY_MS = 15 * 60 * 1000;
const SNOOZE_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function ReturnVisitorReviewPopup() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let hasVisitedBefore = false;
    try {
      hasVisitedBefore = window.localStorage.getItem(VISITED_KEY) === "true";
      if (!hasVisitedBefore) {
        window.localStorage.setItem(VISITED_KEY, "true");
      }
    } catch {
      return;
    }

    if (!hasVisitedBefore) return;

    try {
      if (window.localStorage.getItem(HANDLED_KEY) === "true") return;
      const snoozeUntil = Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);
      if (snoozeUntil && Date.now() < snoozeUntil) return;
    } catch {
      return;
    }

    const timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS_MS));
    } catch {
      // ignore — worst case it asks again sooner than intended
    }
    setVisible(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    const formData = new FormData(event.target);
    const result = await submitReviewInline(formData);

    if (result?.success) {
      try {
        window.localStorage.setItem(HANDLED_KEY, "true");
      } catch {
        // ignore
      }
      setStatus("done");
    } else {
      setError(result?.error || "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (!visible) return null;

  return (
    <div className="review-popup" role="dialog" aria-label="Share your experience">
      <button
        type="button"
        className="review-popup-close"
        onClick={dismiss}
        aria-label="Close"
      >
        ×
      </button>

      {status === "done" ? (
        <p>Thanks for your feedback! Your review is pending approval.</p>
      ) : (
        <>
          <p className="review-popup-title">Enjoying Green Pages?</p>
          <p>Since you&apos;re back, mind leaving a quick review?</p>
          {error && <p className="form-error">{error}</p>}
          <form onSubmit={handleSubmit} className="review-popup-form">
            <input name="reviewerName" type="text" placeholder="Your name" required />
            <select name="rating" defaultValue="5" required>
              <option value="5">★★★★★ Excellent</option>
              <option value="4">★★★★☆ Good</option>
              <option value="3">★★★☆☆ Average</option>
              <option value="2">★★☆☆☆ Poor</option>
              <option value="1">★☆☆☆☆ Terrible</option>
            </select>
            <textarea name="message" rows={3} placeholder="Tell us about your experience" required />
            <div className="review-popup-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={dismiss}>
                Maybe Later
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending…" : "Submit"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
