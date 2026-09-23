// Shared predicates for what counts as a "live" job — mirrors
// lib/seo/businessListings.js's shape (isPublished + matches* +
// filterFor*), adapted for jobs' real foreign-key category_id instead of
// a flat category name field.
//
// isPublishedJob and isAcceptingApplications are deliberately separate: a
// published job stays visible (listings, detail page, sitemap) after its
// deadline passes — it just stops accepting new applications and shows an
// Expired badge instead of Active, same as how real job boards work. Only
// isAcceptingApplications gates whether Apply actually works.
export function isPublishedJob(job) {
  return job.status === "published";
}

export function isAcceptingApplications(job) {
  if (job.status !== "published") return false;
  const now = new Date();
  if (job.expires_at && new Date(job.expires_at) < now) return false;
  if (job.application_deadline && new Date(job.application_deadline) < now) return false;
  return true;
}

// categoryIds: the target category's own id, plus every child id when
// scoping to a parent category — the caller builds this set (see
// lib/jobCategories.js's getNamesUnderJobParent-equivalent), same "parent
// aggregates its children" rule already used for businesses/blog.
export function matchesCategoryIds(job, categoryIds) {
  return categoryIds.includes(job.category_id);
}

export function matchesCity(job, cityName) {
  return Boolean(job.city) && job.city.toLowerCase().includes(cityName.toLowerCase());
}

export function matchesCityCategory(job, cityName, categoryIds) {
  return matchesCity(job, cityName) && matchesCategoryIds(job, categoryIds);
}

export function filterForCategory(jobs, categoryIds) {
  return jobs.filter((job) => isPublishedJob(job) && matchesCategoryIds(job, categoryIds));
}

export function filterForCity(jobs, cityName) {
  return jobs.filter((job) => isPublishedJob(job) && matchesCity(job, cityName));
}

export function filterForCityCategory(jobs, cityName, categoryIds) {
  return jobs.filter((job) => isPublishedJob(job) && matchesCityCategory(job, cityName, categoryIds));
}
