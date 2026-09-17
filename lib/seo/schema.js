// JSON-LD builders shared by every archive/detail page's breadcrumb and
// CollectionPage structured data. Pure functions — no Next.js or Supabase
// imports — so they stay trivially unit-testable.

// items: [{ name, path }] where `path` is a site-relative path ("/businesses")
// for every crumb except optionally the last (the current page, which may
// omit `path` since it isn't a link).
export function buildBreadcrumbSchema(items, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path && { item: `${siteUrl}${item.path}` }),
    })),
  };
}

export function buildCollectionPageSchema({ name, description, path }, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(description && { description }),
    url: `${siteUrl}${path}`,
  };
}
