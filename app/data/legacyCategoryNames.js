// TEMPORARY migration bridge — delete this whole file once Task 3's DB
// normalization actually runs and every businesses.category / .subcategory
// and articles.category value has been rewritten to the new taxonomy's own
// names (see docs/seo/category-migration-diff.md).
//
// Until then, the businesses/articles tables still contain the OLD flat
// category display names (e.g. "Healthcare & Medical", "SEO"), while the
// new taxonomy files use different names/nesting. Category archive pages
// need to match BOTH the new node's own name AND whichever old name(s) used
// to mean the same thing, or every category/city page would show 0 results
// for real, live data until Task 3 lands.
//
// Key = the new taxonomy node's slug (parent or child). Value = extra old
// category name strings that should also count as belonging to that node.
export const BUSINESS_LEGACY_NAMES = {
  "health-medical": ["Healthcare & Medical"],
  "financial-services": ["Financial & Insurance Services"],
  "technology-digital": ["IT & Software Services"],
  "technology-digital/digital-marketing-agencies": ["SEO", "Content Marketing"],
  "technology-digital/web-development": ["Web Development"],
  "technology-digital/cctv-security": ["Security & Surveillance"],
  "transport-logistics": ["Freight, Shipping & Logistics"],
  "travel-hospitality": ["Hospitality & Tourism"],
  "beauty-wellness": ["Cosmetics & Personal Care"],
  "beauty-wellness/beauty-salons": ["Beauty & Salons"],
  "beauty-wellness/gyms-fitness": ["Sports & Fitness"],
  "real-estate-construction": ["Construction & Real Estate", "Real Estate"],
  "real-estate-construction/solar-installation": ["Solar & Renewable Energy"],
  "industrial-manufacturing": ["Manufacturing"],
  "industrial-manufacturing/textile-manufacturers": ["Textiles & Garments"],
  "industrial-manufacturing/machinery-tools": ["Industrial Machinery"],
  "industrial-manufacturing/plastic-packaging": ["Packaging & Printing"],
  "industrial-manufacturing/chemicals-industrial": ["Chemicals, Rubber & Plastics"],
  "shopping-retail": ["Retail & E-Commerce"],
  "shopping-retail/electronics-appliances": ["Electrical & Electronics"],
  "shopping-retail/furniture-stores": ["Furniture & Interior Design"],
  "shopping-retail/clothing-boutiques": ["Fashion & Apparel"],
  "events-weddings": ["Events & Entertainment"],
  "professional-services/lawyers-legal": ["Legal Services"],
  // "Other" is retired outright (see the diff doc) — its 5 businesses are
  // reassigned individually via one-off SQL, not through this bridge.
};

export const BLOG_LEGACY_NAMES = {
  "digital-marketing": ["Marketing"],
  "digital-marketing/seo": ["SEO"],
  "digital-marketing/web-development": ["Web Development"],
  "digital-marketing/content-marketing": ["Content Marketing"],
  "finance": ["Accounting"],
  "finance/loans-and-credit": ["Online"],
  "home-family/home-maintenance": ["Services"],
};

// Builds the full list of old category-name strings a query should match
// for a given taxonomy node, keyed the same way as the maps above
// ("parent-slug" or "parent-slug/child-slug").
function legacyKey(parentSlug, childSlug) {
  return childSlug ? `${parentSlug}/${childSlug}` : parentSlug;
}

// Every name string (new canonical name + any legacy names) that should
// match a single child node.
export function namesForChild(legacyMap, parent, child) {
  return [child.name, ...(legacyMap[legacyKey(parent.slug, child.slug)] ?? [])];
}

// Every name string that should match a parent-level (aggregate) page —
// the parent's own name/legacy names, plus every child's, per the "parent
// categories aggregate their subcategories" rule.
export function namesForParent(legacyMap, parent) {
  const ownNames = [parent.name, ...(legacyMap[legacyKey(parent.slug)] ?? [])];
  const childNames = parent.children.flatMap((child) => namesForChild(legacyMap, parent, child));
  return [...ownNames, ...childNames];
}
