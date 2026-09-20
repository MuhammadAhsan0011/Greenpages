import Link from "next/link";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";
import { SITE_URL } from "@/lib/site";

// Renders the exact `<p className="breadcrumbs">Link / Link / Text</p>`
// markup every page already hand-wrote, plus a matching BreadcrumbList
// JSON-LD script — one place so every archive/detail page's breadcrumb
// trail is guaranteed to carry structured data instead of relying on each
// page to remember to add it.
//
// items: [{ name, path? }] — the last item is usually the current page and
// typically omits `path` (rendered as plain text, not a link).
export default function Breadcrumbs({ items }) {
  const schema = buildBreadcrumbSchema(items, SITE_URL);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <p className="breadcrumbs">
        {items.map((item, index) => (
          <span key={item.name}>
            {index > 0 && " / "}
            {index === 0 && item.name === "Home" && (
              <svg className="breadcrumb-home-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 11.5 12 4l8 7.5M6 9.5V20h5v-5h2v5h5V9.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {item.path ? <Link href={item.path}>{item.name}</Link> : item.name}
          </span>
        ))}
      </p>
    </>
  );
}
