import Image from "next/image";
import Link from "next/link";
import AuthNav from "./AuthNav";
import NavAutoClose from "./NavAutoClose";
import logo from "../../public/images/green-pages-logo.png";

// Server Component. The mobile menu open/close state is handled with a
// pure CSS checkbox trick (see .nav-toggle-checkbox in globals.css)
// instead of React state, so no client-side JavaScript is needed just
// to show/hide the mobile nav. AuthNav is the one small Client Component
// island inside it (see AuthNav.js for why) — everything else here stays
// static.
//
// Deliberately NOT reading the session here even though Navbar sits in the
// root layout on every page: calling the cookie-based server Supabase
// client from a layout that wraps the whole site would force every page
// (including ones with `revalidate`/generateStaticParams today) into fully
// dynamic, uncached rendering. AuthNav figures out the session itself,
// client-side, instead.
export default function Navbar() {
  return (
    <header className="site-header">
      <div className="top-utility-bar">
        <div className="container top-utility-bar-inner">
          <span className="top-utility-item top-utility-tagline">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            Pakistan&apos;s Business Directory &amp; Digital Marketing Agency
          </span>
          <span className="top-utility-right">
            <a href="tel:+923032672509" className="top-utility-item">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 4h3l1.5 4.5L8 10.5a11 11 0 0 0 5.5 5.5l1.5-2.5 4.5 1.5v3c0 1.1-.9 2-2 2C10.5 20 4 13.5 4 6c0-1.1.9-2 2-2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              +92 303 2672509
            </a>
            <a href="mailto:greenpages.pk.com@gmail.com" className="top-utility-item">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M4 7.5 12 13l8-5.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              greenpages.pk.com@gmail.com
            </a>
            <Link href="/signup" className="top-utility-item top-utility-cta">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M4 19c0-3 2.2-5 5-5s5 2 5 5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path d="M17 8v5M14.5 10.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Add Your Business
            </Link>
          </span>
        </div>
      </div>

      <div className="container header-inner">
        <Link href="/" className="logo-group">
          <Image
            src={logo}
            alt="Green Pages PK — Your Business, Our Directory"
            className="logo-image"
            priority
          />
        </Link>

        <input
          type="checkbox"
          id="nav-toggle"
          className="nav-toggle-checkbox"
          aria-hidden="true"
        />
        <label
          htmlFor="nav-toggle"
          className="nav-toggle-label"
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </label>

        <nav className="main-nav" aria-label="Primary">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
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
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <AuthNav />
          </ul>
        </nav>
        <NavAutoClose />
      </div>
    </header>
  );
}
