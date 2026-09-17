// Shared predicates for what counts as a "published, active" business
// listing under a given taxonomy/city scope. Both per-page routes (already
// scoped with a Supabase .eq(...) query) and the bulk sitemap/admin
// aggregation (one unscoped query, filtered here in memory) call these same
// functions, so the count used for indexing decisions can never drift from
// what actually gets rendered.

export function isPublishedBusiness(business) {
  return !business.needs_review;
}

// businesses.category always holds a parent-level name (never a child
// name — children live in .subcategory), so matching on it already
// includes every business under that parent, children included. This is
// what makes "parent aggregates its children's counts" true for free.
export function matchesParent(business, parentName) {
  return business.category === parentName;
}

export function matchesChild(business, parentName, childName) {
  return matchesParent(business, parentName) && business.subcategory === childName;
}

export function matchesCity(business, cityName) {
  return Boolean(business.city) && business.city.toLowerCase().includes(cityName.toLowerCase());
}

export function matchesCityParent(business, cityName, parentName) {
  return matchesCity(business, cityName) && matchesParent(business, parentName);
}

export function filterForParent(businesses, parentName) {
  return businesses.filter((b) => isPublishedBusiness(b) && matchesParent(b, parentName));
}

export function filterForChild(businesses, parentName, childName) {
  return businesses.filter((b) => isPublishedBusiness(b) && matchesChild(b, parentName, childName));
}

export function filterForCity(businesses, cityName) {
  return businesses.filter((b) => isPublishedBusiness(b) && matchesCity(b, cityName));
}

export function filterForCityParent(businesses, cityName, parentName) {
  return businesses.filter((b) => isPublishedBusiness(b) && matchesCityParent(b, cityName, parentName));
}
