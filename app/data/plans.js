// Single source of truth for business listing plan names/prices/ranking/
// capabilities — referenced by /pricing (marketing cards + comparison
// table), the business listing wizard's "Choose Your Plan" step and its
// upload gating, every directory/homepage listing sort, /admin, and the
// public listing card/detail components. A price, label, or capability
// change never needs updating in more than one place.
export const PLAN_PRICING = {
  free: { name: "Basic", price: "Rs. 0", period: "forever" },
  // originalPrice is shown struck through next to price, with offer as a
  // tag, while the limited-time discount runs.
  verified: {
    name: "Verified",
    price: "Rs. 200",
    originalPrice: "Rs. 2,000",
    offer: "90% OFF · Limited Time Offer",
    period: "one-time",
  },
  featured: { name: "Premium", price: "Rs. 4,500", period: "one-time" },
};

export const PLAN_IDS = Object.keys(PLAN_PRICING);

export const PLAN_LABELS = Object.fromEntries(
  Object.entries(PLAN_PRICING).map(([id, p]) => [id, p.name])
);

// Cascading placement rank used by every directory/category/city/homepage
// sort — Premium listings surface above Verified, which surface above
// Basic. Lower number = higher priority. An unrecognized plan value falls
// back to the same rank as Basic at each call site (`PLAN_RANK[plan] ?? 2`).
export const PLAN_RANK = { featured: 0, verified: 1, free: 2 };

export const PLAN_TAGLINE = {
  free: "Get Listed",
  verified: "Build Trust",
  featured: "Get More Visibility",
};

// Gallery photo cap per plan — enforced both here (wizard UI/hints) and
// server-side in app/account/actions.js's upsertBusiness.
export const PHOTO_LIMITS = { free: 1, verified: 3, featured: 8 };

// What each plan actually unlocks — the practical difference buyers are
// paying for, not just a price/badge. Enforced server-side in
// app/account/actions.js, not just hidden in the UI.
export const PLAN_CAPABILITIES = {
  free: {
    logo: true,
    coverImage: false,
    socialLinks: false,
    aboutEditor: false,
    verifiedBadge: false,
    featured: false,
    priority: false,
    homepageFeatured: false,
  },
  verified: {
    logo: true,
    coverImage: true,
    socialLinks: true,
    aboutEditor: true,
    verifiedBadge: true,
    featured: false,
    priority: true,
    homepageFeatured: false,
  },
  featured: {
    logo: true,
    coverImage: true,
    socialLinks: true,
    aboutEditor: true,
    verifiedBadge: false,
    featured: true,
    priority: true,
    homepageFeatured: true,
  },
};

export function isPaidPlan(plan) {
  return plan === "verified" || plan === "featured";
}

export function getPlanCapabilities(plan) {
  return PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free;
}

export function getPhotoLimit(plan) {
  return PHOTO_LIMITS[plan] ?? PHOTO_LIMITS.free;
}

// Annual "Publisher Plan" — what an author/business pays once a year to
// raise how OFTEN they can submit articles (see PUBLISHER_SUBMISSION_LIMITS
// below). Replaces the old per-article Free/Featured/Sponsored payment:
// articles.submission_plan (which lib/seo/articleLinks.js still reads for
// rel="sponsored" and the link-count cap) is now derived from this at
// submit time instead of chosen and paid per article — see
// publisherPlanToSubmissionPlan() below and createArticle in
// app/account/articles/actions.js.
export const PUBLISHER_PLAN_PRICING = {
  basic: { name: "Basic", price: "Rs. 0", period: "forever" },
  // originalPrice is shown struck through next to price, with offer as a
  // tag, while the limited-time discount runs.
  featured: {
    name: "Featured",
    price: "Rs. 1,500",
    originalPrice: "Rs. 3,000",
    offer: "50% OFF · Limited Time Offer",
    period: "per year",
  },
  sponsored: { name: "Sponsored", price: "Rs. 6,000", period: "per year" },
};

export const PUBLISHER_PLAN_IDS = Object.keys(PUBLISHER_PLAN_PRICING);

export const PUBLISHER_PLAN_LABELS = Object.fromEntries(
  Object.entries(PUBLISHER_PLAN_PRICING).map(([id, p]) => [id, p.name])
);

// Lower number = higher tier — same convention as PLAN_RANK above.
export const PUBLISHER_PLAN_RANK = { sponsored: 0, featured: 1, basic: 2 };

// How often each Publisher Plan tier may submit a real article (drafts are
// always unlimited and never count — see saveArticleDraft). windowDays is a
// rolling lookback from "now", not a calendar day/week, so there's no
// midnight-boundary edge case to reason about. Enforced in createArticle.
export const PUBLISHER_SUBMISSION_LIMITS = {
  basic: { maxArticles: 1, windowDays: 7, windowLabel: "7 days" },
  featured: { maxArticles: 1, windowDays: 1, windowLabel: "24 hours" },
  sponsored: { maxArticles: 3, windowDays: 1, windowLabel: "24 hours" },
};

export function getPublisherSubmissionLimit(publisherPlan) {
  return PUBLISHER_SUBMISSION_LIMITS[publisherPlan] ?? PUBLISHER_SUBMISSION_LIMITS.basic;
}

// articles.submission_plan keeps its original three values — only the
// "basic" tier is named differently here (it was always "free" on the
// article itself), so every existing rel="sponsored"/link-limit call site
// keyed off submission_plan needs zero changes.
export function publisherPlanToSubmissionPlan(publisherPlan) {
  return publisherPlan === "basic" ? "free" : publisherPlan;
}
