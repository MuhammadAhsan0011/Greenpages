import Link from "next/link";
import AuthNav from "./AuthNav";

// Server Component. The mobile menu open/close state is handled with a
// pure CSS checkbox trick (see .nav-toggle-checkbox in globals.css)
// instead of React state, so no client-side JavaScript is needed just
// to show/hide the mobile nav. AuthNav is the one small Client Component
// island inside it (see AuthNav.js for why) — everything else here stays
// static.
export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          GrowthPro
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
              <Link href="/contact">Contact</Link>
            </li>
            <AuthNav />
          </ul>
        </nav>
      </div>
    </header>
  );
}
