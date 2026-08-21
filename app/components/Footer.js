import Link from "next/link";
import { services } from "../data/services";

// Server Component — purely presentational, no client interactivity needed.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h2>GrowthPro</h2>
            <p>
              A full-service digital marketing agency helping businesses grow
              through SEO, web development, and content marketing.
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
                <Link href="/blog">Blog</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
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
              <li>hello@growthpro.example</li>
              <li>+1 (555) 010-2024</li>
              <li>Remote-first, serving clients worldwide</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {year} GrowthPro. All rights reserved.</span>
          <span>Replace example.com with your production domain.</span>
        </div>
      </div>
    </footer>
  );
}
