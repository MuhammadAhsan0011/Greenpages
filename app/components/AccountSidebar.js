"use client";

// Client Component — needs usePathname() to highlight the current page in
// the nav, same reason app/components/LegalSidebar.js is a Client Component.
// Everything it renders still comes from props the layout fetched
// server-side; this doesn't add any client-side data fetching.

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AccountSidebar({ user, profile, business }) {
  const pathname = usePathname();
  const memberId = user.id.slice(0, 8).toUpperCase();
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-identity">
        <div className="sidebar-avatar" aria-hidden="true">
          {(profile?.full_name ?? "M").charAt(0).toUpperCase()}
        </div>
        <p className="sidebar-name">{profile?.full_name ?? "Member"}</p>
        {business?.name && <p className="sidebar-business">{business.name}</p>}
        <span className="member-badge">Free Member</span>
      </div>

      <dl className="sidebar-meta">
        <div>
          <dt>Member ID</dt>
          <dd>#{memberId}</dd>
        </div>
        {joinDate && (
          <div>
            <dt>Joined</dt>
            <dd>{joinDate}</dd>
          </div>
        )}
      </dl>

      <nav className="sidebar-nav" aria-label="Account">
        <ul>
          <li>
            <Link href="/account" className={pathname === "/account" ? "active" : ""}>
              My Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/account/business"
              className={pathname.startsWith("/account/business") ? "active" : ""}
            >
              Business Profile
            </Link>
          </li>
          <li>
            <Link
              href="/account/articles/new"
              className={pathname === "/account/articles/new" ? "active" : ""}
            >
              <span aria-hidden="true">✍️</span> Write an Article
            </Link>
          </li>
          <li>
            <Link
              href="/account/articles"
              className={
                pathname.startsWith("/account/articles") && pathname !== "/account/articles/new"
                  ? "active"
                  : ""
              }
            >
              My Articles
            </Link>
          </li>
          <li>
            <Link href="/businesses" className={pathname === "/businesses" ? "active" : ""}>
              Business Directory
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
