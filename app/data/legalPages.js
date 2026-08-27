// Single source of truth for the /legal/* policy pages — used by the
// shared sidebar (LegalSidebar.js) and the footer's Legal column, so the
// list only has to be maintained in one place.

export const LEGAL_PAGES = [
  { slug: "terms", label: "Terms & Conditions", icon: "📄" },
  { slug: "privacy", label: "Privacy Policy", icon: "🔒" },
  { slug: "cookies", label: "Cookie Policy", icon: "🍪" },
  { slug: "posting-rules", label: "Posting Rules", icon: "📋" },
  { slug: "safety-tips", label: "Safety Tips", icon: "🛡️" },
  { slug: "refund-policy", label: "Refund Policy", icon: "💳" },
  { slug: "community-standards", label: "Community Standards", icon: "👥" },
  { slug: "faq", label: "FAQ & Support", icon: "❓" },
];
