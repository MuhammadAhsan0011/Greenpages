import { Suspense } from "react";
import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import ScrollToTopButton from "./ScrollToTopButton";

// Server Component — purely presentational, no client interactivity needed
// (NewsletterForm posts via a Server Action; ScrollToTopButton is the one
// small Client Component island, for the scroll listener). NewsletterForm
// uses useSearchParams(), which requires a Suspense boundary — without it,
// every page that renders this footer (via the root layout) would be
// forced out of static rendering.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <footer className="site-footer" id="footer-newsletter">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h2>Green Pages</h2>
              <p>
                Green Pages PK is Pakistan&apos;s business directory and
                digital marketing agency, helping businesses connect with
                local customers and grow online.
              </p>
              <div className="footer-social-links">
                <a
                  href="https://www.facebook.com/greenpages.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Green Pages on Facebook"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M14 9h2.5V6h-2.5c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h2.5l.5-3H13v-2c0-.6.4-1 1-1Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/greenpages.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Green Pages on Instagram"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="16.6" cy="7.4" r="1" fill="currentColor" />
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/company/green-pages-pk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Green Pages on LinkedIn"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="5" y="9" width="3" height="10" fill="currentColor" />
                    <circle cx="6.5" cy="5.5" r="1.8" fill="currentColor" />
                    <path
                      d="M11 9h3v1.6c.6-1 1.7-1.8 3.3-1.8 2.5 0 3.7 1.7 3.7 4.6V19h-3v-5.2c0-1.4-.5-2.4-1.8-2.4-1 0-1.6.7-1.9 1.3-.1.2-.1.6-.1 1V19h-3V9Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <nav className="footer-col" aria-label="Quick Links">
              <h3>Quick Links</h3>
              <ul>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/about">About Us</Link>
                </li>
                <li>
                  <Link href="/services">Services</Link>
                </li>
                <li>
                  <Link href="/businesses">Directory</Link>
                </li>
                <li>
                  <Link href="/blog">Blog</Link>
                </li>
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
            </nav>

            <nav className="footer-col" aria-label="For Businesses">
              <h3>For Businesses</h3>
              <ul>
                <li>
                  <Link href="/signup">Add Your Business</Link>
                </li>
                <li>
                  <Link href="/pricing">Pricing Plans</Link>
                </li>
                <li>
                  <Link href="/login">Business Login</Link>
                </li>
                <li>
                  <Link href="/account/articles/new">Submit an Article</Link>
                </li>
                <li>
                  <Link href="/reviews">Reviews</Link>
                </li>
              </ul>
            </nav>

            <nav className="footer-col" aria-label="Support">
              <h3>Support</h3>
              <ul>
                <li>
                  <Link href="/legal/faq">Help Center</Link>
                </li>
                <li>
                  <Link href="/legal/terms">Terms &amp; Conditions</Link>
                </li>
                <li>
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/legal/posting-rules">Listing Guidelines</Link>
                </li>
                <li>
                  <Link href="/contact">Contact Us</Link>
                </li>
              </ul>
            </nav>

            <div className="footer-col">
              <h3>Newsletter</h3>
              <p className="footer-newsletter-copy">
                Get updates, tips, and business growth insights.
              </p>
              <Suspense fallback={<div className="footer-newsletter-form-placeholder" />}>
                <NewsletterForm />
              </Suspense>
            </div>
          </div>

          <div className="footer-bottom">
            <span>&copy; {year} Green Pages PK. All rights reserved.</span>
          </div>
        </div>
      </footer>
      <ScrollToTopButton />
    </>
  );
}
