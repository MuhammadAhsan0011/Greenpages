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
              <li>kimmak209@gmail.com</li>
              <li>+92 300 1234567</li>
              <li>Islamabad, Pakistan</li>
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
