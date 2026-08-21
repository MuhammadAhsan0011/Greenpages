import Link from "next/link";

// Server Component — purely presentational, driven by data the layout
// already fetched, so no client-side JavaScript is needed.
export default function AccountSidebar({ user, profile, business }) {
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
            <Link href="/account">My Dashboard</Link>
          </li>
          <li>
            <Link href="/account/business">Business Profile</Link>
          </li>
          <li>
            <Link href="/account/articles">My Articles</Link>
          </li>
          <li>
            <Link href="/businesses">Business Directory</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
