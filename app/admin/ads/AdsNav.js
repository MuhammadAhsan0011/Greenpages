import Link from "next/link";

const TABS = [
  { id: "ads", href: "/admin/ads", label: "All Advertisements" },
  { id: "new", href: "/admin/ads/new", label: "Add New" },
  { id: "slots", href: "/admin/ads/slots", label: "Placement Settings" },
  { id: "analytics", href: "/admin/ads/analytics", label: "Analytics" },
];

export default function AdsNav({ active }) {
  return (
    <nav className="admin-ads-nav" aria-label="Advertisement Manager">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={tab.id === active ? "admin-ads-tab admin-ads-tab-active" : "admin-ads-tab"}
          aria-current={tab.id === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
      <Link href="/admin" className="admin-ads-tab admin-ads-tab-back">
        ← Admin
      </Link>
    </nav>
  );
}
