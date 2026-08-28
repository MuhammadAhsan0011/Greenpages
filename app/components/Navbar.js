import Link from "next/link";
import AuthNav from "./AuthNav";
import NavAutoClose from "./NavAutoClose";

// Server Component. The mobile menu open/close state is handled with a
// pure CSS checkbox trick (see .nav-toggle-checkbox in globals.css)
// instead of React state, so no client-side JavaScript is needed just
// to show/hide the mobile nav. AuthNav is the one small Client Component
// island inside it (see AuthNav.js for why) — everything else here stays
// static. The search row below submits a plain GET request to /businesses,
// so it works with zero client-side JavaScript too.
export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo-group">
          <svg
            className="logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.5" />
            <line
              x1="15.3"
              y1="15.3"
              x2="21"
              y2="21"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="logo-text-group">
            <span className="logo">Green Pages</span>
            <span className="logo-tagline">Pakistan Business Directory</span>
          </span>
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
              <Link href="/blog">Blog</Link>
            </li>
            <li>
              <Link href="/businesses">Directory</Link>
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

      <div className="header-search-row">
        <div className="container">
          <form action="/businesses" method="get" className="header-search-form">
            <div className="header-search-field">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
                <line
                  x1="15.3"
                  y1="15.3"
                  x2="21"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <label htmlFor="header-search-q" className="visually-hidden">
                Name or Keyword
              </label>
              <input id="header-search-q" name="q" type="text" placeholder="Name or Keyword" />
            </div>
            <div className="header-search-field">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <label htmlFor="header-search-city" className="visually-hidden">
                City or Post Code
              </label>
              <input
                id="header-search-city"
                name="city"
                type="text"
                placeholder="City or Post Code"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
