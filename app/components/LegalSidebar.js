"use client";

// This MUST be a Client Component because it needs usePathname() to
// highlight the current page in the list — everything else about the
// /legal/* pages stays server-rendered.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_PAGES } from "../data/legalPages";

export default function LegalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-identity">
        <p className="sidebar-name">Policy Directory</p>
        <p className="sidebar-business">Guidelines for using Green Pages</p>
      </div>

      <nav className="sidebar-nav" aria-label="Policy pages">
        <ul>
          {LEGAL_PAGES.map((page) => {
            const href = `/legal/${page.slug}`;
            const isActive = pathname === href;
            return (
              <li key={page.slug}>
                <Link href={href} className={isActive ? "active" : ""}>
                  <span aria-hidden="true">{page.icon}</span> {page.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
