import Link from "next/link";
import { services } from "../data/services";
import { LEGAL_PAGES } from "../data/legalPages";

// Server Component — purely presentational, no client interactivity needed.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h2>Green Pages</h2>
            <p>
              Pakistan&apos;s business directory and digital marketing
              agency — get listed, get found, and grow with expert SEO, web
              development, and content marketing.
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
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
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

          <nav className="footer-col" aria-label="Company">
            <h3>Company</h3>
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
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              <li>
                <Link href="/reviews">Reviews</Link>
              </li>
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Services">
            <h3>Services</h3>
            <ul>
              {services.map((service) => (
                <li key={service.slug}>
                  <Link href={`/services/${service.slug}`}>
                    {service.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-col">
            <h3>Contact</h3>
            <ul>
              <li>greenpages.pk.com@gmail.com</li>
              <li>+92 303 2672509</li>
              <li>Karachi, Pakistan</li>
            </ul>
          </div>

          <nav className="footer-col" aria-label="Legal">
            <h3>Legal</h3>
            <ul>
              {LEGAL_PAGES.map((page) => (
                <li key={page.slug}>
                  <Link href={`/legal/${page.slug}`}>{page.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="footer-bottom">
          <span>&copy; {year} Green Pages. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
